import { Combatant } from "../domain/Combatant";
import { CombatConfiguration } from "../domain/CombatConfiguration";
import { ICombatantRepository } from "./ICombatantRepository";

const CollectionService = game.GetService("CollectionService");
const HttpService = game.GetService("HttpService");

export class CombatModelLoader
{
	private static readonly COMBATANT_TAG = "Combatant";
	private static readonly COMBATANT_ID_ATTRIBUTE = "CombatantId";
	private static readonly MAX_HEALTH_ATTRIBUTE = "MaxHealth";
	private static readonly ATTACK_DAMAGE_ATTRIBUTE = "AttackDamage";

	private readonly registeredModels = new Map<Model, string>();
	private readonly deathConnections = new Map<Model, RBXScriptConnection>();
	private readonly destroyConnections = new Map<Model, RBXScriptConnection>();

	private started = false;

	public constructor(
		private readonly repository: ICombatantRepository,
		private readonly configuration: CombatConfiguration,
	)
	{
	}

	public start(): void
	{
		assert(!this.started, "CombatModelLoader has already been started");

		this.started = true;

		CollectionService.GetInstanceAddedSignal(
			CombatModelLoader.COMBATANT_TAG,
		).Connect((instance: Instance) =>
		{
			task.spawn(() =>
			{
				this.registerInstance(instance);
			});
		});

		CollectionService.GetInstanceRemovedSignal(
			CombatModelLoader.COMBATANT_TAG,
		).Connect((instance: Instance) =>
		{
			this.unregisterInstance(instance);
		});

		for (const instance of CollectionService.GetTagged(CombatModelLoader.COMBATANT_TAG))
		{
			task.spawn(() =>
			{
				this.registerInstance(instance);
			});
		}
	}

	private registerInstance(instance: Instance): void
	{
		if (!instance.IsA("Model"))
		{
			warn(`Instance '${instance.GetFullName()}' has the Combatant tag but is not a Model`);
			return;
		}

		this.registerModel(instance);
	}

	private registerModel(model: Model): void
	{
		if (this.registeredModels.has(model))
		{
			return;
		}

		const humanoidInstance = model.WaitForChild("Humanoid", 5);
		const rootPartInstance = model.WaitForChild("HumanoidRootPart", 5);

		if (humanoidInstance === undefined || !humanoidInstance.IsA("Humanoid"))
		{
			warn(`Combat model '${model.GetFullName()}' requires a Humanoid`);
			return;
		}

		if (rootPartInstance === undefined || !rootPartInstance.IsA("BasePart"))
		{
			warn(`Combat model '${model.GetFullName()}' requires a HumanoidRootPart`);
			return;
		}

		if (!CollectionService.HasTag(model, CombatModelLoader.COMBATANT_TAG))
		{
			return;
		}

		const combatantId = this.getOrCreateCombatantId(model);
		const existingCombatant = this.repository.findById(combatantId);

		if (existingCombatant !== undefined)
		{
			warn(`Combatant with id '${combatantId}' already exists`);
			return;
		}

		const maxHealth = this.getPositiveNumberAttribute(
			model,
			CombatModelLoader.MAX_HEALTH_ATTRIBUTE,
			this.configuration.defaultHealth,
		);

		const attackDamage = this.getPositiveNumberAttribute(
			model,
			CombatModelLoader.ATTACK_DAMAGE_ATTRIBUTE,
			this.configuration.defaultAttackDamage,
		);

		const combatant = new Combatant(combatantId, maxHealth, attackDamage);

		this.repository.add(combatant);
		this.registeredModels.set(model, combatantId);

		humanoidInstance.MaxHealth = maxHealth;
		humanoidInstance.Health = maxHealth;

		this.deathConnections.set(
			model,
			humanoidInstance.Died.Connect(() =>
			{
				this.handleModelDeath(model);
			}),
		);

		this.destroyConnections.set(
			model,
			model.Destroying.Connect(() =>
			{
				this.unregisterModel(model);
			}),
		);

		if (this.configuration.debug)
		{
			print(`Registered combat model '${model.Name}' with id '${combatantId}'`);
		}
	}

	private unregisterInstance(instance: Instance): void
	{
		if (!instance.IsA("Model"))
		{
			return;
		}

		this.unregisterModel(instance);
	}

	private unregisterModel(model: Model): void
	{
		const combatantId = this.registeredModels.get(model);

		if (combatantId === undefined)
		{
			return;
		}

		this.deathConnections.get(model)?.Disconnect();
		this.destroyConnections.get(model)?.Disconnect();

		this.deathConnections.delete(model);
		this.destroyConnections.delete(model);
		this.registeredModels.delete(model);

		if (this.repository.findById(combatantId) !== undefined)
		{
			this.repository.remove(combatantId);
		}

		if (this.configuration.debug)
		{
			print(`Unregistered combat model '${model.Name}'`);
		}
	}

	private handleModelDeath(model: Model): void
	{
		const combatantId = this.registeredModels.get(model);

		if (combatantId === undefined)
		{
			return;
		}

		const combatant = this.repository.findById(combatantId);

		if (combatant === undefined || combatant.isDead())
		{
			return;
		}

		combatant.takeDamage(combatant.getHealth());
		this.repository.save(combatant);

		if (this.configuration.debug)
		{
			print(`Combat model '${model.Name}' died`);
		}
	}

	private getOrCreateCombatantId(model: Model): string
	{
		const existingId = model.GetAttribute(
			CombatModelLoader.COMBATANT_ID_ATTRIBUTE,
		);

		if (typeIs(existingId, "string") && existingId.size() > 0)
		{
			return existingId;
		}

		const generatedId = `model-${HttpService.GenerateGUID(false)}`;

		model.SetAttribute(
			CombatModelLoader.COMBATANT_ID_ATTRIBUTE,
			generatedId,
		);

		return generatedId;
	}

	private getPositiveNumberAttribute(
		model: Model,
		attributeName: string,
		defaultValue: number,
	): number
	{
		const value = model.GetAttribute(attributeName);

		if (typeIs(value, "number") && value > 0)
		{
			return value;
		}

		model.SetAttribute(attributeName, defaultValue);

		return defaultValue;
	}
}