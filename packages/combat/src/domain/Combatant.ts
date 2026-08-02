export class Combatant
{
	private blocking = false;

	public constructor( private readonly id: string, private health: number,  private readonly attackDamage: number)
	{
		assert(id.size() > 0, "Id cannot be empty");
		assert(health > 0, "Health must be greater than zero");
		assert(attackDamage > 0, "Attack damage must be greater than zero");
	}

	public getId(): string
	{
		return this.id;
	}

	public getHealth(): number
	{
		return this.health;
	}

	public getAttackDamage(): number
	{
		return this.attackDamage;
	}

	public setBlocking(enabled: boolean): void
	{
		this.blocking = enabled;
	}

	public takeDamage(amount: number): number
	{
		assert(amount >= 0, "Damage cannot be negative");

		const finalDamage = this.blocking
			? amount * 0.5
			: amount;

		const appliedDamage = math.min(this.health, finalDamage);

		this.health -= appliedDamage;

		return appliedDamage;
	}
}