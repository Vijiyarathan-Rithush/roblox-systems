import { Combatant } from "../domain/Combatant";
import { ICombatantRepository } from "../infrastructure/ICombatantRepository";
import { ICombatService } from "./ICombatService";

export class CombatService implements ICombatService
{
	public constructor(private readonly repository: ICombatantRepository)
	{
	}

	public attack(attackerId: string, targetId: string): number
	{
		assert(attackerId !== targetId, "A combatant cannot attack itself");

		const attacker = this.getCombatant(attackerId);

		if (attacker.isDead() || attacker.isBlocking())
		{
			return 0;
		}

		return this.takeDamage(targetId, attacker.getAttackDamage());
	}

	public block(combatantId: string, enabled: boolean): void
	{
		const combatant = this.getCombatant(combatantId);

		combatant.setBlocking(enabled);
		this.repository.save(combatant);
	}

	public takeDamage(combatantId: string, amount: number): number
	{
		const combatant = this.getCombatant(combatantId);
		const appliedDamage = combatant.takeDamage(amount);

		this.repository.save(combatant);

		return appliedDamage;
	}

	private getCombatant(id: string): Combatant
	{
		const combatant = this.repository.findById(id);

		assert(combatant !== undefined, `Combatant with id '${id}' does not exist`);

		return combatant;
	}
}