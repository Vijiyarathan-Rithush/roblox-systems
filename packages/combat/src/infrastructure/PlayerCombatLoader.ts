import { Combatant } from "../domain/Combatant";
import { ICombatantRepository } from "./ICombatantRepository";

const Players = game.GetService("Players");

export class PlayerCombatLoader
{
	private static readonly DEFAULT_HEALTH = 100;
	private static readonly DEFAULT_ATTACK_DAMAGE = 10;

	private started = false;

	public constructor(private readonly repository: ICombatantRepository) {}

	public start(): void
	{
		assert(!this.started, "PlayerCombatLoader has already been started");

		this.started = true;

		Players.PlayerAdded.Connect((player: Player ) =>
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
			PlayerCombatLoader.DEFAULT_HEALTH,
			PlayerCombatLoader.DEFAULT_ATTACK_DAMAGE,
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