import { Combatant } from "../domain/Combatant";
import { CombatConfiguration } from "../domain/CombatConfiguration";
import { ICombatantRepository } from "./ICombatantRepository";

const Players = game.GetService("Players");

export class CombatCharacterBinder
{
	private readonly configuredPlayers = new Set<Player>();
	private started = false;

	public constructor(
		private readonly repository: ICombatantRepository,
		private readonly configuration: CombatConfiguration,
	)
	{
	}

	public start(): void
	{
		assert(!this.started, "CombatCharacterBinder has already been started");

		this.started = true;

		Players.PlayerAdded.Connect((player: Player) =>
		{
			this.bindPlayer(player);
		});

		Players.PlayerRemoving.Connect((player: Player) =>
		{
			this.configuredPlayers.delete(player);
		});

		for (const player of Players.GetPlayers())
		{
			this.bindPlayer(player);
		}
	}

	private bindPlayer(player: Player): void
	{
		if (this.configuredPlayers.has(player))
		{
			return;
		}

		this.configuredPlayers.add(player);

		player.CharacterAdded.Connect((character: Model) =>
		{
			this.bindCharacter(player, character);
		});

		if (player.Character !== undefined)
		{
			this.bindCharacter(player, player.Character);
		}
	}

	private bindCharacter(player: Player, character: Model): void
	{
		const combatant = this.getOrResetCombatant(player);
		const humanoidInstance = character.WaitForChild("Humanoid", 10);

		if (humanoidInstance === undefined || !humanoidInstance.IsA("Humanoid"))
		{
			warn(`${character.GetFullName()} requires a Humanoid`);
			return;
		}

		character.SetAttribute("CombatantId", combatant.getId());

		humanoidInstance.MaxHealth = this.configuration.defaultHealth;
		humanoidInstance.Health = combatant.getHealth();

		humanoidInstance.Died.Connect(() =>
		{
			this.handleCharacterDeath(combatant.getId());
		});

		if (this.configuration.debug)
		{
			print(`Bound character '${character.Name}' to combatant '${combatant.getId()}'`);
		}
	}

	private getOrResetCombatant(player: Player): Combatant
	{
		const combatantId = tostring(player.UserId);
		const existingCombatant = this.repository.findById(combatantId);

		if (existingCombatant !== undefined && !existingCombatant.isDead())
		{
			return existingCombatant;
		}

		if (existingCombatant !== undefined)
		{
			this.repository.remove(combatantId);
		}

		const combatant = new Combatant(
			combatantId,
			this.configuration.defaultHealth,
			this.configuration.defaultAttackDamage,
		);

		this.repository.add(combatant);

		return combatant;
	}

	private handleCharacterDeath(combatantId: string): void
	{
		const combatant = this.repository.findById(combatantId);

		if (combatant === undefined || combatant.isDead())
		{
			return;
		}

		combatant.takeDamage(combatant.getHealth());
		this.repository.save(combatant);

		if (this.configuration.debug)
		{
			print(`Combatant '${combatantId}' died`);
		}
	}
}