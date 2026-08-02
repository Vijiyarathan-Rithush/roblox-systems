import { CombatConfiguration } from "../domain/CombatConfiguration";

const Workspace =
	game.GetService("Workspace");

export class CombatConfigurationLoader
{
	private static readonly CONFIGURATION_NAME = "CombatConfiguration";
	private static readonly DEFAULT_HEALTH_ATTRIBUTE = "DefaultHealth";
	private static readonly DEFAULT_ATTACK_DAMAGE_ATTRIBUTE = "DefaultAttackDamage";
	private static readonly MAX_ATTACK_DISTANCE_ATTRIBUTE = "MaxAttackDistance";
	private static readonly ATTACK_COOLDOWN_ATTRIBUTE = "AttackCooldown";
	private static readonly BLOCKING_DAMAGE_MULTIPLIER_ATTRIBUTE = "BlockingDamageMultiplier";
	private static readonly FRIENDLY_FIRE_ATTRIBUTE = "FriendlyFire";
	private static readonly DEBUG_ATTRIBUTE = "Debug";

	public load(): CombatConfiguration
	{
		const configurationInstance =
			this.getOrCreateConfigurationInstance();

		const defaultHealth =
			this.getNumberAttribute(
				configurationInstance,
				CombatConfigurationLoader.DEFAULT_HEALTH_ATTRIBUTE,
				CombatConfiguration.DEFAULT_HEALTH,
			);

		const defaultAttackDamage =
			this.getNumberAttribute(
				configurationInstance,
				CombatConfigurationLoader.DEFAULT_ATTACK_DAMAGE_ATTRIBUTE,
				CombatConfiguration.DEFAULT_ATTACK_DAMAGE,
			);

		const maxAttackDistance =
			this.getNumberAttribute(
				configurationInstance,
				CombatConfigurationLoader.MAX_ATTACK_DISTANCE_ATTRIBUTE,
				CombatConfiguration.DEFAULT_MAX_ATTACK_DISTANCE,
			);

		const attackCooldown =
			this.getNumberAttribute(
				configurationInstance,
				CombatConfigurationLoader.ATTACK_COOLDOWN_ATTRIBUTE,
				CombatConfiguration.DEFAULT_ATTACK_COOLDOWN,
			);

		const blockingDamageMultiplier =
			this.getNumberAttribute(
				configurationInstance,
				CombatConfigurationLoader.BLOCKING_DAMAGE_MULTIPLIER_ATTRIBUTE,
				CombatConfiguration.DEFAULT_BLOCKING_DAMAGE_MULTIPLIER,
			);

		const friendlyFire =
			this.getBooleanAttribute(
				configurationInstance,
				CombatConfigurationLoader.FRIENDLY_FIRE_ATTRIBUTE,
				CombatConfiguration.DEFAULT_FRIENDLY_FIRE,
			);

		const debug =
			this.getBooleanAttribute(
				configurationInstance,
				CombatConfigurationLoader.DEBUG_ATTRIBUTE,
				CombatConfiguration.DEFAULT_DEBUG,
			);

		return new CombatConfiguration(
			defaultHealth,
			defaultAttackDamage,
			maxAttackDistance,
			attackCooldown,
			blockingDamageMultiplier,
			friendlyFire,
			debug,
		);
	}

	private getOrCreateConfigurationInstance(): Configuration
	{
		const existingInstance =
			Workspace.FindFirstChild(
				CombatConfigurationLoader.CONFIGURATION_NAME,
			);

		if (existingInstance !== undefined)
		{
			assert(
				existingInstance.IsA("Configuration"),
				`${CombatConfigurationLoader.CONFIGURATION_NAME} must be a Configuration`,
			);

			return existingInstance;
		}

		const configurationInstance =
			new Instance("Configuration");

		configurationInstance.Name =
			CombatConfigurationLoader.CONFIGURATION_NAME;

		configurationInstance.Parent =
			Workspace;

		return configurationInstance;
	}

	private getNumberAttribute(
		instance: Instance,
		attributeName: string,
		defaultValue: number,
	): number
	{
		const attributeValue =
			instance.GetAttribute(
				attributeName,
			);

		if (typeIs(attributeValue, "number"))
		{
			return attributeValue;
		}

		instance.SetAttribute(
			attributeName,
			defaultValue,
		);

		return defaultValue;
	}

	private getBooleanAttribute(
		instance: Instance,
		attributeName: string,
		defaultValue: boolean,
	): boolean
	{
		const attributeValue =
			instance.GetAttribute(
				attributeName,
			);

		if (typeIs(attributeValue, "boolean"))
		{
			return attributeValue;
		}

		instance.SetAttribute(
			attributeName,
			defaultValue,
		);

		return defaultValue;
	}
}