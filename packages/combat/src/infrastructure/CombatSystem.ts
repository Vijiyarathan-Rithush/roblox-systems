import { CombatConfiguration } from "../domain/CombatConfiguration";
import { CombatService } from "../service/CombatService";
import { ICombatService } from "../service/ICombatService";
import { CombatCharacterBinder } from "./CombatCharacterBinder";
import { CombatConfigurationLoader } from "./CombatConfigurationLoader";
import { CombatInputHandler } from "./CombatInputHandler";
import { CombatModelLoader } from "./CombatModelLoader";
import { CombatRemoteHandler } from "./CombatRemoteHandler";
import { ICombatantRepository } from "./ICombatantRepository";
import { MemoryCombatantRepository } from "./MemoryCombatantRepository";
import { PlayerCombatLoader } from "./PlayerCombatLoader";

const RunService = game.GetService("RunService");

type CombatSystemState = "stopped" | "starting" | "started" | "failed";

export class CombatSystem
{
	private static state: CombatSystemState = "stopped";

	private static configuration: CombatConfiguration | undefined;
	private static repository: ICombatantRepository | undefined;
	private static combatService: ICombatService | undefined;

	private static playerCombatLoader: PlayerCombatLoader | undefined;
	private static characterBinder: CombatCharacterBinder | undefined;
	private static modelLoader: CombatModelLoader | undefined;
	private static remoteHandler: CombatRemoteHandler | undefined;
	private static inputHandler: CombatInputHandler | undefined;

	private constructor()
	{
	}

	public static start(): void
	{
		if (CombatSystem.state === "started")
		{
			return;
		}

		if (CombatSystem.state === "starting")
		{
			CombatSystem.waitForStartup();
			return;
		}

		assert(
			CombatSystem.state !== "failed",
			"CombatSystem startup previously failed. Restart the current Roblox session.",
		);

		CombatSystem.state = "starting";

		let startupCompleted = false;

		try
		{
			if (RunService.IsServer())
			{
				CombatSystem.startServer();
			}
			else if (RunService.IsClient())
			{
				CombatSystem.startClient();
			}
			else
			{
				error("CombatSystem could not determine the runtime environment");
			}

			startupCompleted = true;
		}
		finally
		{
			CombatSystem.state = startupCompleted ? "started" : "failed";
		}
	}

	public static isStarted(): boolean
	{
		return CombatSystem.state === "started";
	}

	public static getService(): ICombatService
	{
		const service = CombatSystem.combatService;

		assert(
			service !== undefined,
			"CombatService is only available after starting CombatSystem on the server",
		);

		return service;
	}

	public static getRepository(): ICombatantRepository
	{
		const repository = CombatSystem.repository;

		assert(
			repository !== undefined,
			"CombatantRepository is only available after starting CombatSystem on the server",
		);

		return repository;
	}

	public static getConfiguration(): CombatConfiguration
	{
		const configuration = CombatSystem.configuration;

		assert(
			configuration !== undefined,
			"CombatConfiguration is only available after starting CombatSystem on the server",
		);

		return configuration;
	}

	private static waitForStartup(): void
	{
		while (CombatSystem.state === "starting")
		{
			task.wait();
		}

		assert(
			CombatSystem.state === "started",
			"CombatSystem startup failed in another execution thread",
		);
	}

	private static startServer(): void
	{
		const configuration = new CombatConfigurationLoader().load();
		const repository = new MemoryCombatantRepository();
		const combatService = new CombatService(repository);

		const playerCombatLoader = new PlayerCombatLoader(repository, configuration);
		const characterBinder = new CombatCharacterBinder(repository, configuration);
		const modelLoader = new CombatModelLoader(repository, configuration);

		const remoteHandler = new CombatRemoteHandler(
			repository,
			combatService,
			configuration,
		);

		CombatSystem.configuration = configuration;
		CombatSystem.repository = repository;
		CombatSystem.combatService = combatService;
		CombatSystem.playerCombatLoader = playerCombatLoader;
		CombatSystem.characterBinder = characterBinder;
		CombatSystem.modelLoader = modelLoader;
		CombatSystem.remoteHandler = remoteHandler;

		playerCombatLoader.start();
		characterBinder.start();
		modelLoader.start();
		remoteHandler.start();

		if (configuration.debug)
		{
			print("CombatSystem server started");
		}
	}

	private static startClient(): void
	{
		const inputHandler = new CombatInputHandler();

		CombatSystem.inputHandler = inputHandler;

		inputHandler.start();
	}
}