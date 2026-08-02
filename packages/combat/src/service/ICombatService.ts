export interface ICombatService
{
	attack(attackerId: string, targetId: string): number;

	block(combatantId: string, enabled: boolean): void;

	takeDamage(combatantId: string, amount: number): number;
}