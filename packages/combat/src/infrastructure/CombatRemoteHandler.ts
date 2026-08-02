import { CombatConfiguration } from "../domain/CombatConfiguration";
import { ICombatService } from "../service/ICombatService";
import { ICombatantRepository } from "./ICombatantRepository";

const Players = game.GetService("Players");
const ReplicatedStorage = game.GetService("ReplicatedStorage");
const Workspace = game.GetService("Workspace");

export class CombatRemoteHandler
{
	private static readonly ATTACK_REMOTE_NAME = "AttackRequest";

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

		const attackRemote = this.getOrCreateAttackRemote();

		attackRemote.OnServerEvent.Connect((player: Player, targetValue: unknown) =>
		{
			this.handleAttackRequest(player, targetValue);
		});

		Players.PlayerRemoving.Connect((player: Player) =>
		{
			this.lastAttackTimes.delete(player);
		});
	}

	private getOrCreateAttackRemote(): RemoteEvent
	{
		const existingRemote = ReplicatedStorage.FindFirstChild(
			CombatRemoteHandler.ATTACK_REMOTE_NAME,
		);

		if (existingRemote !== undefined)
		{
			assert(
				existingRemote.IsA("RemoteEvent"),
				`${CombatRemoteHandler.ATTACK_REMOTE_NAME} must be a RemoteEvent`,
			);

			return existingRemote;
		}

		const attackRemote = new Instance("RemoteEvent");

		attackRemote.Name = CombatRemoteHandler.ATTACK_REMOTE_NAME;
		attackRemote.Parent = ReplicatedStorage;

		return attackRemote;
	}

	private handleAttackRequest(player: Player, targetValue: unknown): void
	{
		if (!typeIs(targetValue, "Instance") || !targetValue.IsA("Model"))
		{
			return;
		}

		const targetModel = targetValue;

		if (!targetModel.IsDescendantOf(Workspace))
		{
			return;
		}

		const character = player.Character;

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

		const attackerRoot = this.getRootPart(character);
		const targetRoot = this.getRootPart(targetModel);

		if (attackerRoot === undefined || targetRoot === undefined)
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

		const humanoid = targetModel.FindFirstChildWhichIsA("Humanoid");

		if (humanoid !== undefined)
		{
			humanoid.Health = updatedTarget.getHealth();
		}

		if (this.configuration.debug)
		{
			print(`${player.Name} attacked ${targetModel.Name}`);
			print(`Applied damage: ${appliedDamage}`);
			print(`Remaining health: ${updatedTarget.getHealth()}`);
		}
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