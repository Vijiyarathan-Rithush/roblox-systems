import { Combatant } from "../domain/Combatant";

export interface ICombatantRepository
{
	add(combatant: Combatant): void;

	findById(id: string): Combatant | undefined;

	save(combatant: Combatant): void;

	remove(id: string): void;
}