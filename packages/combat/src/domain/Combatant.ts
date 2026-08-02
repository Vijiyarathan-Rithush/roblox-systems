export class Combatant
{
	private blocking = false;

	public constructor(
		private readonly id: string,
		private health: number,
		private readonly attackDamage: number,
		private readonly blockingDamageMultiplier: number,
	)
	{
		assert(id.size() > 0, "Id cannot be empty");
		assert(health > 0, "Health must be greater than zero");
		assert(attackDamage > 0, "Attack damage must be greater than zero");

		assert(
			blockingDamageMultiplier >= 0 && blockingDamageMultiplier <= 1,
			"Blocking damage multiplier must be between zero and one",
		);
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

	public isBlocking(): boolean
	{
		return this.blocking;
	}

	public isDead(): boolean
	{
		return this.health <= 0;
	}

	public setBlocking(enabled: boolean): void
	{
		if (this.isDead())
		{
			this.blocking = false;
			return;
		}

		this.blocking = enabled;
	}

	public takeDamage(amount: number): number
	{
		assert(amount >= 0, "Damage cannot be negative");

		if (this.isDead())
		{
			return 0;
		}

		const finalDamage = this.blocking
			? amount * this.blockingDamageMultiplier
			: amount;

		const appliedDamage = math.min(this.health, finalDamage);

		this.health -= appliedDamage;

		if (this.isDead())
		{
			this.blocking = false;
		}

		return appliedDamage;
	}
}