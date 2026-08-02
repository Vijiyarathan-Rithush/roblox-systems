import { Combatant } from "../domain/Combatant";
import { CombatConfiguration } from "../domain/CombatConfiguration";
import { ICombatantRepository } from "./ICombatantRepository";

const Players = game.GetService("Players");

export class PlayerCombatLoader
{
	private started = false;

	public constructor(
		private readonly repository: ICombatantRepository,
		private readonly configuration: CombatConfiguration,
	)
	{
	}

	public start(): void
	{
		assert(!this.started, "PlayerCombatLoader has already been started");

		this.started = true;

		Players.PlayerAdded.Connect((player: Player) =>
		{
			this.addPlayer(player);
		});

		Players.PlayerRemoving.Connect((player: Player) =>
		{
			this.removePlayer(player);
		});

		for (const player of Players.GetPlayers())
		{
			this.addPlayer(player);
		}
	}

	private addPlayer(player: Player): void
	{
		const id = this.getPlayerId(player);

		if (this.repository.findById(id) !== undefined)
		{
			return;
		}

		const combatant = new Combatant(
			id,
			this.configuration.defaultHealth,
			this.configuration.defaultAttackDamage,
			this.configuration.blockingDamageMultiplier,
		);

		this.repository.add(combatant);
	}

	private removePlayer(player: Player): void
	{
		const id = this.getPlayerId(player);

		this.repository.remove(id);
	}

	private getPlayerId(player: Player): string
	{
		return tostring(player.UserId);
	}
}