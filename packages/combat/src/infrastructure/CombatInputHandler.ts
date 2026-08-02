const Players = game.GetService("Players");
const ReplicatedStorage = game.GetService("ReplicatedStorage");
const UserInputService = game.GetService("UserInputService");

export class CombatInputHandler
{
	private static readonly ATTACK_REMOTE_NAME = "AttackRequest";
	private static readonly BLOCK_REMOTE_NAME = "BlockRequest";

	private started = false;
	private blocking = false;

	public start(): void
	{
		assert(!this.started, "CombatInputHandler has already been started");

		this.started = true;

		const attackRemote = this.getRemote(CombatInputHandler.ATTACK_REMOTE_NAME);
		const blockRemote = this.getRemote(CombatInputHandler.BLOCK_REMOTE_NAME);
		const mouse = Players.LocalPlayer.GetMouse();

		UserInputService.InputBegan.Connect((input: InputObject, gameProcessed: boolean) =>
		{
			if (gameProcessed)
			{
				return;
			}

			if (input.KeyCode === Enum.KeyCode.F)
			{
				this.setBlocking(blockRemote, true);
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

		UserInputService.InputEnded.Connect((input: InputObject) =>
		{
			if (input.KeyCode === Enum.KeyCode.F)
			{
				this.setBlocking(blockRemote, false);
			}
		});

		UserInputService.WindowFocusReleased.Connect(() =>
		{
			this.setBlocking(blockRemote, false);
		});
	}

	private setBlocking(blockRemote: RemoteEvent, enabled: boolean): void
	{
		if (this.blocking === enabled)
		{
			return;
		}

		this.blocking = enabled;
		blockRemote.FireServer(enabled);
	}

	private getRemote(name: string): RemoteEvent
	{
		const remoteInstance = ReplicatedStorage.WaitForChild(name, 10);

		assert(remoteInstance !== undefined, `${name} was not created by the server`);
		assert(remoteInstance.IsA("RemoteEvent"), `${name} must be a RemoteEvent`);

		return remoteInstance;
	}
}