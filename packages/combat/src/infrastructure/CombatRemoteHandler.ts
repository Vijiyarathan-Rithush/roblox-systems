import { CombatConfiguration } from "../domain/CombatConfiguration";
import { ICombatService } from "../service/ICombatService";
import { ICombatantRepository } from "./ICombatantRepository";

const Players = game.GetService("Players");
const ReplicatedStorage = game.GetService("ReplicatedStorage");
const Workspace = game.GetService("Workspace");

export class CombatRemoteHandler
{
	private static readonly ATTACK_REMOTE_NAME = "AttackRequest";
	private static readonly BLOCK_REMOTE_NAME = "BlockRequest";

	private readonly lastAttackTimes = new Map<Player, number>();
	private started = false;

	public constructor(
		private readonly repository: ICombatantRepository,
		private readonly combatService: ICombatService,
		private readonly configuration: CombatConfiguration,
	)
	{
	}

	public start(): void
	{
		assert(!this.started, "CombatRemoteHandler has already been started");
		this.started = true;

		const attackRemote = this.getOrCreateRemote(CombatRemoteHandler.ATTACK_REMOTE_NAME);
		const blockRemote = this.getOrCreateRemote(CombatRemoteHandler.BLOCK_REMOTE_NAME);

		attackRemote.OnServerEvent.Connect((player: Player, targetValue: unknown) =>
		{
			this.handleAttackRequest(player, targetValue);
		});

		blockRemote.OnServerEvent.Connect((player: Player, enabledValue: unknown) =>
		{
			this.handleBlockRequest(player, enabledValue);
		});

		Players.PlayerRemoving.Connect((player: Player) =>
		{
			this.lastAttackTimes.delete(player);
		});
	}

	private handleAttackRequest(player: Player, targetValue: unknown): void
	{
		if (!typeIs(targetValue, "Instance") || !targetValue.IsA("Model"))
		{
			return;
		}

		const targetModel = targetValue;
		const character = player.Character;

		if (!targetModel.IsDescendantOf(Workspace))
		{
			return;
		}

		if (character === undefined || targetModel === character)
		{
			return;
		}

		const targetIdValue = targetModel.GetAttribute("CombatantId");

		if (!typeIs(targetIdValue, "string") || targetIdValue.size() === 0)
		{
			return;
		}

		const attackerId = tostring(player.UserId);

		if (attackerId === targetIdValue)
		{
			return;
		}

		const attacker = this.repository.findById(attackerId);
		const target = this.repository.findById(targetIdValue);

		if (attacker === undefined || target === undefined)
		{
			return;
		}

		if (attacker.isDead() || target.isDead())
		{
			return;
		}

		if (attacker.isBlocking())
		{
			return;
		}

		if (this.isFriendlyFireBlocked(player, targetModel))
		{
			if (this.configuration.debug)
			{
				print(`${player.Name} could not attack a teammate`);
			}

			return;
		}

		const attackerRoot = this.getRootPart(character);
		const targetRoot = this.getRootPart(targetModel);
		const targetHumanoid = targetModel.FindFirstChildWhichIsA("Humanoid");

		if (attackerRoot === undefined || targetRoot === undefined || targetHumanoid === undefined)
		{
			return;
		}

		if (targetHumanoid.Health <= 0)
		{
			return;
		}

		const distance = attackerRoot.Position.sub(targetRoot.Position).Magnitude;

		if (distance > this.configuration.maxAttackDistance)
		{
			if (this.configuration.debug)
			{
				print(`Attack rejected because target distance was ${distance}`);
			}

			return;
		}

		if (this.isAttackOnCooldown(player))
		{
			return;
		}

		const appliedDamage = this.combatService.attack(attackerId, targetIdValue);
		const updatedTarget = this.repository.findById(targetIdValue);

		if (updatedTarget === undefined)
		{
			return;
		}

		targetHumanoid.Health = math.max(0, updatedTarget.getHealth());

		if (this.configuration.debug)
		{
			print(`${player.Name} attacked ${targetModel.Name}`);
			print(`Applied damage: ${appliedDamage}`);
			print(`Remaining health: ${updatedTarget.getHealth()}`);
		}
	}

	private handleBlockRequest(player: Player, enabledValue: unknown): void
	{
		if (!typeIs(enabledValue, "boolean"))
		{
			return;
		}

		const combatantId = tostring(player.UserId);
		const combatant = this.repository.findById(combatantId);

		if (combatant === undefined)
		{
			return;
		}

		if (combatant.isDead())
		{
			if (combatant.isBlocking())
			{
				this.combatService.block(combatantId, false);
			}

			return;
		}

		this.combatService.block(combatantId, enabledValue);

		if (this.configuration.debug)
		{
			print(`${player.Name} blocking: ${enabledValue}`);
		}
	}

	private isFriendlyFireBlocked(attacker: Player, targetModel: Model): boolean
	{
		if (this.configuration.friendlyFire)
		{
			return false;
		}

		const targetPlayer = Players.GetPlayerFromCharacter(targetModel);

		if (targetPlayer === undefined)
		{
			return false;
		}

		if (attacker.Neutral || targetPlayer.Neutral)
		{
			return false;
		}

		const attackerTeam = attacker.Team;
		const targetTeam = targetPlayer.Team;

		if (attackerTeam === undefined || targetTeam === undefined)
		{
			return false;
		}

		return attackerTeam === targetTeam;
	}

	private isAttackOnCooldown(player: Player): boolean
	{
		const currentTime = os.clock();
		const lastAttackTime = this.lastAttackTimes.get(player);

		if (
			lastAttackTime !== undefined &&
			currentTime - lastAttackTime < this.configuration.attackCooldown
		)
		{
			return true;
		}

		this.lastAttackTimes.set(player, currentTime);

		return false;
	}

	private getOrCreateRemote(name: string): RemoteEvent
	{
		const existingRemote = ReplicatedStorage.FindFirstChild(name);

		if (existingRemote !== undefined)
		{
			assert(existingRemote.IsA("RemoteEvent"), `${name} must be a RemoteEvent`);
			return existingRemote;
		}

		const remoteEvent = new Instance("RemoteEvent");

		remoteEvent.Name = name;
		remoteEvent.Parent = ReplicatedStorage;

		return remoteEvent;
	}

	private getRootPart(model: Model): BasePart | undefined
	{
		const rootPart = model.FindFirstChild("HumanoidRootPart");

		if (rootPart === undefined || !rootPart.IsA("BasePart"))
		{
			return undefined;
		}

		return rootPart;
	}
}