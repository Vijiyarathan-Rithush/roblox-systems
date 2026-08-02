export class CombatConfiguration
{
	public static readonly DEFAULT_HEALTH = 100;
	public static readonly DEFAULT_ATTACK_DAMAGE = 10;
	public static readonly DEFAULT_MAX_ATTACK_DISTANCE = 15;
	public static readonly DEFAULT_ATTACK_COOLDOWN = 0.6;
	public static readonly DEFAULT_BLOCKING_DAMAGE_MULTIPLIER = 0.5;
	public static readonly DEFAULT_FRIENDLY_FIRE = false;
	public static readonly DEFAULT_DEBUG = false;

	public constructor(
		public readonly defaultHealth: number,
		public readonly defaultAttackDamage: number,
		public readonly maxAttackDistance: number,
		public readonly attackCooldown: number,
		public readonly blockingDamageMultiplier: number,
		public readonly friendlyFire: boolean,
		public readonly debug: boolean,
	)
	{
		assert(defaultHealth > 0, "Default health must be greater than zero");

        assert(defaultAttackDamage > 0, "Default attack damage must be greater than zero");

		assert(maxAttackDistance > 0, "Maximum attack distance must be greater than zero");

		assert(attackCooldown >= 0, "Attack cooldown cannot be negative");

		assert(blockingDamageMultiplier >= 0 && blockingDamageMultiplier <= 1, "Blocking damage multiplier must be between zero and one");
	}

	public static createDefault(): CombatConfiguration
	{
		return new CombatConfiguration(
			CombatConfiguration.DEFAULT_HEALTH,
			CombatConfiguration.DEFAULT_ATTACK_DAMAGE,
			CombatConfiguration.DEFAULT_MAX_ATTACK_DISTANCE,
			CombatConfiguration.DEFAULT_ATTACK_COOLDOWN,
			CombatConfiguration.DEFAULT_BLOCKING_DAMAGE_MULTIPLIER,
			CombatConfiguration.DEFAULT_FRIENDLY_FIRE,
			CombatConfiguration.DEFAULT_DEBUG,
		);
	}
}