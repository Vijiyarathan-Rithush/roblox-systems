const Players = game.GetService("Players");
const ReplicatedStorage = game.GetService("ReplicatedStorage");
const UserInputService = game.GetService("UserInputService");

export class CombatInputHandler
{
	private static readonly ATTACK_REMOTE_NAME = "AttackRequest";

	private started = false;

	public start(): void
	{
		assert(!this.started, "CombatInputHandler has already been started");

		this.started = true;

		const attackRemote = this.getAttackRemote();
		const player = Players.LocalPlayer;
		const mouse = player.GetMouse();

		UserInputService.InputBegan.Connect((input: InputObject, gameProcessed: boolean) =>
		{
			if (gameProcessed)
			{
				return;
			}

			if (input.UserInputType !== Enum.UserInputType.MouseButton1)
			{
				return;
			}

			const targetPart = mouse.Target;

			if (targetPart === undefined)
			{
				return;
			}

			const targetModel = targetPart.FindFirstAncestorOfClass("Model");

			if (targetModel === undefined)
			{
				return;
			}

			attackRemote.FireServer(targetModel);
		});
	}

	private getAttackRemote(): RemoteEvent
	{
		const remoteInstance = ReplicatedStorage.WaitForChild(
			CombatInputHandler.ATTACK_REMOTE_NAME,
			10,
		);

		assert(
			remoteInstance !== undefined,
			`${CombatInputHandler.ATTACK_REMOTE_NAME} was not created by the server`,
		);

		assert(
			remoteInstance.IsA("RemoteEvent"),
			`${CombatInputHandler.ATTACK_REMOTE_NAME} must be a RemoteEvent`,
		);

		return remoteInstance;
	}
}