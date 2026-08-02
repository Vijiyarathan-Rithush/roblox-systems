import { Combatant } from "../domain/Combatant";
import { ICombatantRepository } from "./ICombatantRepository";

export class MemoryCombatantRepository implements ICombatantRepository
{
	private readonly combatants = new Map<string, Combatant>();

	public add(combatant: Combatant): void
	{
		const id = combatant.getId();

		assert(!this.combatants.has(id), `Combatant with id '${id}' already exists`);

		this.combatants.set(id, combatant);
	}

	public findById(id: string): Combatant | undefined
	{
		return this.combatants.get(id);
	}

	public save(combatant: Combatant): void
	{
		const id = combatant.getId();

		assert(this.combatants.has(id), `Combatant with id '${id}' does not exist`);

		this.combatants.set(id, combatant);
	}

	public remove(id: string): void
	{
		this.combatants.delete(id);
	}
}