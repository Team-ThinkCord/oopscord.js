import { AnySelectMenuInteraction, ButtonInteraction, ChatInputCommandInteraction, Client, ClientEvents, Collection, ContextMenuCommandBuilder, ContextMenuCommandInteraction, ContextMenuCommandType, Interaction, LabelBuilder, ModalSubmitInteraction, REST, SlashCommandBuilder } from "discord.js";
import { ApplicationIntegrationType, RESTPostAPIApplicationCommandsJSONBody, Routes } from "discord-api-types/v10";
import { DiscordModuleEvents,  ModuleOptions } from "./decorators/DiscordModuleDecorator";
import { COMMAND_DESCRIPTION_KEY, COMMAND_NAME_KEY, COMMAND_PRIVATE_KEY, DICSORD_MODULE_OPTIONS_KEY, DISCORD_MODULE_INTERNAL_EVENTS_KEY, INTERACTION_TYPE_KEY, COMMAND_OPTIONS_KEY, COMMAND_PRIVATE_GUILD_KEY, INTERACTION_RUN_METHOD_KEY, OPTIONS_PARAMETER_INDEX_KEY, INTERACTION_PARAMETER_INDEX_KEY, COMMAND_SUBCOMMAND_GROUPS_KEY, COMMAND_SUBCOMMANDS_KEY, MODULE_TYPE_KEY, ModuleType, COMMAND_MODULE_COMMANDS_KEY, MESSAGE_COMPONENT_MODULE_COMPONENTS_KEY, BUTTON_OPTIONS_KEY, SELECT_MENU_OPTIONS_KEY, MODAL_OPTIONS_KEY, MODAL_TEXT_INPUT_VALUE_INDEX_KEY, CONTEXT_MENU_TYPE_KEY, INTERACTION_INTEGRATION_TYPES_KEY, MODAL_SELECT_MENU_VALUE_INDEX_KEY, MODAL_FILE_UPLOAD_VALUE_INDEX_KEY, MODAL_COMPONENTS_KEY } from "./decorators/Constants";
import { InteractionType, SlashCommandOptions } from "./Constants";
import { ContextMenuOptions, OptionsIndex } from "./decorators/CommandDecorator";
import { FieldIndex, ModalComponentData, ModalFieldIndex, ModalLabelComponentData, Plugin } from ".";
import { Util } from "../utils/Util";

/** The logger interface used for logging application events and errors. You can implement this interface to create a custom logger or use the default console logger. */
export interface Logger {
    info(message: string): void;
    warn(message: string): void;
    error(message: string): void;
}

/**
 * Options for configuring the Discord application, including logger and plugins.
 * @param logger An optional logger object for logging application events and errors. Defaults to the console if not provided.
 * @param plugins An optional array of plugins to extend the functionality of the Discord application. Plugins can be used to add additional features or integrations.
 * @public
 */
export interface DiscordAppOptions {
    logger?: Logger;
    plugins?: Plugin[]
}

const defaultDiscordAppOptions: DiscordAppOptions = {
    logger: console,
    plugins: []
}

/**
 * The main class that you must extend to create a Discord application. You create an instance by using the `DiscordApp.create()` method.
 *
 * @example
 * 
 * ```ts
 * import { DiscordApp, BaseDiscordModule } from "oopscord.js";
 *
 * ＠DiscordModule({
 *     token: "your-token-goes-here",
 *     intents: [ IntentsBitField.Flags.Guilds, IntentsBitField.Flags.GuildMessages, IntentsBitField.Flags.MessageContent ],
 *     imports: [ MyCommandModule, MyComponentModule ]
 * })
 * export class AppModule extends BaseDiscordModule {
 *     ＠EventHandler("clientReady")
 *     onReady() {
 *         this.logger.info("Client is ready!");
 *     }
 * }
 * ```
 * 
 * @see {@link DiscordApp.create}
 */
export class BaseDiscordModule {
    client: Client;
    logger: Logger;

    constructor(client: Client, logger: Logger) {
        this.client = client;
        this.logger = logger;
    }

    /** Dummy. */
    _onReady() {

    }
}

let a1 = false;

/**
 * Main application class for managing Discord bot functionality.
 * 
 * Handles initialization, login, command deployment, and interaction routing for a Discord application.
 * This class uses the Discord.js library and implements a decorator-based command and component system.
 * 
 * @example
 * ```ts
 * import { DiscordApp } from "oopscord.js";
 * import { AppModule } from "./app.module";
 * 
 * async function bootstrap() {
 *    const app = DiscordApp.create(AppModule);
 *    await app.login();
 * }
 * 
 * bootstrap();
 * ```
 * 
 * @remarks
 * - Must be instantiated using the static `create()` method
 * - Supports global and guild-specific (private) command deployment
 * - Routes interactions (commands, buttons, select menus, modals) to appropriate handlers
 * - Uses reflection metadata for decorator-based configuration
 * 
 * @public
 */
export class DiscordApp {
    #rest: REST;
    #client!: Client;
    #moduleFunction!: typeof BaseDiscordModule;
    #module!: BaseDiscordModule & { [key in keyof ClientEvents]?: ClientEvents[key] };
    #appOptions!: DiscordAppOptions;
    #moduleOptions!: ModuleOptions;
    #commands!: (new (...args: any[]) => any)[];
    #buttons!: (new (...args: any[]) => any)[];
    #selectMenus!: (new (...args: any[]) => any)[];
    #modals!: (new (...args: any[]) => any)[];
    #loadStartTimestamp!: number;

    constructor() {
        if (!a1) throw new ReferenceError("Please use DiscordApp.create()");

        a1 = false;

        this.#loadStartTimestamp = Date.now();

        this.#rest = new REST({ version: "10" });
    }

    /**
     * Logs in to Discord and deploys the commands. This method must be called after creating the application with `DiscordApp.create()`.
     * @see {@link DiscordApp.create}
     */
    async login() {
        const commands = this.#commands.filter(i => Reflect.getMetadata(INTERACTION_TYPE_KEY, i) == InteractionType.CHAT_INPUT_COMMAND || Reflect.getMetadata(INTERACTION_TYPE_KEY, i) == InteractionType.CONTEXT_MENU_COMMAND);
        const privateCommands = commands.filter(c => Reflect.getMetadata(COMMAND_PRIVATE_KEY, c));
        const globalCommands = commands.filter(c => !Reflect.getMetadata(COMMAND_PRIVATE_KEY, c));

        this.#module.logger.info(`Found ${commands.length} command(s) in total, ${globalCommands.length} global command(s) and ${privateCommands.length} private command(s). (${(Date.now() - this.#loadStartTimestamp)}ms)`);

        this.#module.logger.info("Mapping global commands...");

        // Prepare global commands
        const apiGlobalCommands: RESTPostAPIApplicationCommandsJSONBody[] = globalCommands.map(c => {
            const type = Reflect.getMetadata(INTERACTION_TYPE_KEY, c);
            const integrationTypes = Reflect.getMetadata(INTERACTION_INTEGRATION_TYPES_KEY, c);

            if (type == InteractionType.CHAT_INPUT_COMMAND) return this.#mapSlashCommand(Reflect.getMetadata(COMMAND_NAME_KEY, c), Reflect.getMetadata(COMMAND_DESCRIPTION_KEY, c), Reflect.getMetadata(COMMAND_OPTIONS_KEY, c), integrationTypes)
            else return this.#mapContextMenuCommand(Reflect.getMetadata(COMMAND_NAME_KEY, c), Reflect.getMetadata(CONTEXT_MENU_TYPE_KEY, c), integrationTypes);
        });

        this.#module.logger.info(`└─ Mapped ${apiGlobalCommands.length} global command(s). (${(Date.now() - this.#loadStartTimestamp)}ms)`);

        this.#module.logger.info("Mapping private commands...");

        // Prepare private commands
        const apiPrivateCommands: { [guildId: string]: RESTPostAPIApplicationCommandsJSONBody[] } = {}

        privateCommands.forEach(c => {
            const guildId: string = Reflect.getMetadata(COMMAND_PRIVATE_GUILD_KEY, c);

            const type = Reflect.getMetadata(INTERACTION_TYPE_KEY, c);
            const integrationTypes = Reflect.getMetadata(INTERACTION_INTEGRATION_TYPES_KEY, c);

            let data: RESTPostAPIApplicationCommandsJSONBody;

            if (type == InteractionType.CHAT_INPUT_COMMAND) data = this.#mapSlashCommand(Reflect.getMetadata(COMMAND_NAME_KEY, c), Reflect.getMetadata(COMMAND_DESCRIPTION_KEY, c), Reflect.getMetadata(COMMAND_OPTIONS_KEY, c), integrationTypes)
            else data = this.#mapContextMenuCommand(Reflect.getMetadata(COMMAND_NAME_KEY, c), Reflect.getMetadata(CONTEXT_MENU_TYPE_KEY, c), integrationTypes);

            if (!Array.isArray(apiPrivateCommands[guildId])) apiPrivateCommands[guildId] = [];

            apiPrivateCommands[guildId].push(data);
        });

        const wholePrivateCommands = Object.values(apiPrivateCommands).flat();

        this.#module.logger.info(`└─ Mapped ${Object.keys(apiPrivateCommands).length} guild(s) with ${wholePrivateCommands.length} private command(s). (${(Date.now() - this.#loadStartTimestamp)}ms)`);

        this.#rest.setToken(this.#moduleOptions.token);

        this.#module.logger.info("Logging in...");

        await this.#client.login(this.#moduleOptions.token);

        this.#module.logger.info(`Successfully logged in. (${(Date.now() - this.#loadStartTimestamp)}ms)`);

        try {
            this.#module.logger.info("Deploying commands...");

            if (this.#moduleOptions.test!.enable) {
                await this.#rest.put(
                    Routes.applicationGuildCommands(this.#client.user!.id, this.#moduleOptions.test!.guild!),
                    { body: apiGlobalCommands }
                );

                this.#module.logger.info(`├─ Successfully registered global commands, in test guild ${this.#moduleOptions.test!.guild}. (${(Date.now() - this.#loadStartTimestamp)}ms)`);
            } else {
                await this.#rest.put(
                    Routes.applicationCommands(this.#client.user!.id),
                    { body: apiGlobalCommands }
                );

                this.#module.logger.info(`├─ Successfully registered global commands. (${(Date.now() - this.#loadStartTimestamp)}ms)`);
            }

            for (const guildId in apiPrivateCommands) {
                await this.#rest.put(
                    Routes.applicationGuildCommands(this.#client.user!.id, guildId),
                    { body: apiPrivateCommands[guildId] }
                );

                this.#module.logger.info(`├─ Successfully registered private commands in ${guildId}. (${(Date.now() - this.#loadStartTimestamp)}ms)`);
            }

            this.#module.logger.info("└─ Successfully deployed all commands.");
        } catch (err) {
            this.#module.logger.warn("Failed to deploy commands.");
            this.#module.logger.warn((err as Error).stack!);
        }

        this.#module.logger.info("Application took " + (Date.now() - this.#loadStartTimestamp) + "ms to load.");
    }

    /**
     * Handles incoming chat input command interactions by routing them to the appropriate command handler based on the command name, subcommand group, and subcommand. It uses reflection metadata to determine which handler to invoke and what arguments to pass.
     * @param itr The chat input command interaction to handle.
     * @returns {void}
     * @internal
     */
    #chatInputCommandHandler(itr: ChatInputCommandInteraction): void {
        const commands = this.#commands.filter(i => Reflect.getMetadata(INTERACTION_TYPE_KEY, i) == InteractionType.CHAT_INPUT_COMMAND);

        const commandName = itr.commandName;
        const command = commands.find(c => Reflect.getMetadata(COMMAND_NAME_KEY, c) == commandName);

        if (!command) return;

        if (itr.options.getSubcommandGroup(false)) {
            let handler = (Reflect.getMetadata(COMMAND_SUBCOMMAND_GROUPS_KEY, command)[itr.options.getSubcommandGroup(true)] as Array<(new (...args: any[]) => any)>)?.find(c => Reflect.getMetadata(COMMAND_NAME_KEY, c) == itr.options.getSubcommand(true));

            if (!handler) return;

            let runMethod: string = Reflect.getMetadata(INTERACTION_RUN_METHOD_KEY, handler);
            let preArgs: (number | OptionsIndex)[] = [ Reflect.getMetadata(INTERACTION_PARAMETER_INDEX_KEY, handler), ...(Reflect.getMetadata(OPTIONS_PARAMETER_INDEX_KEY, handler) || []) ];
            let args: (ChatInputCommandInteraction | any)[] = Array(preArgs.length).fill(null);

            if (runMethod == undefined) throw new TypeError("Failed to get the run method. Did you add the @Run decorator?");

            preArgs.forEach(arg => {
                if (typeof arg == "number") args[arg] = itr;
                else args[arg.index] = (itr.options[arg.getMethod] as (name: string) => any)(arg.name)
            });

            let cmd = new handler(...args);

            cmd[runMethod]();
        } else if (itr.options.getSubcommand(false)) {
            let handler = (Reflect.getMetadata(COMMAND_SUBCOMMANDS_KEY, command) as (new (...args: any[]) => any)[]).find(c => Reflect.getMetadata(COMMAND_NAME_KEY, c) == itr.options.getSubcommand(true));

            if (!handler) return;

            let runMethod: string = Reflect.getMetadata(INTERACTION_RUN_METHOD_KEY, handler);
            let preArgs: (number | OptionsIndex)[] = [ Reflect.getMetadata(INTERACTION_PARAMETER_INDEX_KEY, handler), ...(Reflect.getMetadata(OPTIONS_PARAMETER_INDEX_KEY, handler) || []) ];
            let args: (ChatInputCommandInteraction | any)[] = Array(preArgs.length).fill(null);

            if (runMethod == undefined) throw new TypeError("Failed to get the run method. Did you add the @Run decorator?");

            preArgs.forEach(arg => {
                if (typeof arg == "number") args[arg] = itr;
                else args[arg.index] = (itr.options[arg.getMethod] as (name: string) => any)(arg.name)
            });

            let cmd = new handler(...args);

            cmd[runMethod]();
        } else {
            let runMethod: string = Reflect.getMetadata(INTERACTION_RUN_METHOD_KEY, command);
            let preArgs: (number | OptionsIndex)[] = [ Reflect.getMetadata(INTERACTION_PARAMETER_INDEX_KEY, command), ...(Reflect.getMetadata(OPTIONS_PARAMETER_INDEX_KEY, command) || []) ];
            let args: (ChatInputCommandInteraction | any)[] = Array(preArgs.length).fill(null);

            if (runMethod == undefined) throw new TypeError("Failed to get the run method. Did you add the @Run decorator?");

            preArgs.forEach(arg => {
                if (typeof arg == "number") args[arg] = itr;
                else args[arg.index] = (itr.options[arg.getMethod] as (name: string) => any)(arg.name)
            });

            let cmd = new command(...args);

            cmd[runMethod]();
        }
    }

    /**
     * Handles incoming context menu command interactions by routing them to the appropriate command handler based on the command name and type. It uses reflection metadata to determine which handler to invoke and what arguments to pass.
     * @param itr The context menu command interaction to handle.
     * @returns {void}
     * @internal
     */
    #contextMenuCommandHandler(itr: ContextMenuCommandInteraction): void {
        const commands = this.#commands.filter(i => Reflect.getMetadata(INTERACTION_TYPE_KEY, i) == InteractionType.CONTEXT_MENU_COMMAND);

        const commandName = itr.commandName;
        const command = commands.find(c => Reflect.getMetadata(COMMAND_NAME_KEY, c) == commandName && (Reflect.getMetadata(COMMAND_OPTIONS_KEY, c) as ContextMenuOptions).type == itr.commandType);

        if (!command) return;

        let runMethod: string = Reflect.getMetadata(INTERACTION_RUN_METHOD_KEY, command);

        if (runMethod == undefined) throw new TypeError("Failed to get the run method. Did you add the @Run decorator?");

        let cmd = new command(itr);

        cmd[runMethod]();
    }

    /**
     * Handles incoming button interactions by routing them to the appropriate button handler based on the custom ID. It uses reflection metadata to determine which handler to invoke and what arguments to pass.
     * @param itr The button interaction to handle.
     * @returns {void}
     * @internal
     */
    #buttonHandler(itr: ButtonInteraction): void {
        const button = this.#buttons.find(b => Reflect.getMetadata(BUTTON_OPTIONS_KEY, b).customId == itr.customId);

        if (!button) return;

        let runMethod: string = Reflect.getMetadata(INTERACTION_RUN_METHOD_KEY, button);

        if (runMethod == undefined) throw new TypeError("Failed to get the run method. Did you add the @Run decorator?");

        let cmd = new button(itr);

        cmd[runMethod]();
    }

    /**
     * Handles incoming select menu interactions by routing them to the appropriate select menu handler based on the custom ID. It uses reflection metadata to determine which handler to invoke and what arguments to pass.
     * @param itr The select menu interaction to handle.
     * @returns {void}
     * @internal
     */
    #selectMenuHandler(itr: AnySelectMenuInteraction): void {
        const selectMenu = this.#selectMenus.find(b => Reflect.getMetadata(SELECT_MENU_OPTIONS_KEY, b).customId == itr.customId);

        if (!selectMenu) return;

        let runMethod: string = Reflect.getMetadata(INTERACTION_RUN_METHOD_KEY, selectMenu);

        if (runMethod == undefined) throw new TypeError("Failed to get the run method. Did you add the @Run decorator?");

        let cmd = new selectMenu(itr);

        cmd[runMethod]();
    }

    /**
     * Handles incoming modal submit interactions by routing them to the appropriate modal handler based on the custom ID. It uses reflection metadata to determine which handler to invoke and what arguments to pass, including extracting values from text input components if necessary.
     * @param itr The modal submit interaction to handle.
     * @returns {void}
     * @internal
     */
    #modalHandler(itr: ModalSubmitInteraction): void {
        const modal = this.#modals.find(b => Reflect.getMetadata(MODAL_OPTIONS_KEY, b).customId == itr.customId);

        if (!modal) return;

        const modalComponents = Reflect.getMetadata(MODAL_COMPONENTS_KEY, modal) as ModalComponentData[];

        let runMethod: string = Reflect.getMetadata(INTERACTION_RUN_METHOD_KEY, modal);
        let preArgs: (number | FieldIndex)[] = [ Reflect.getMetadata(INTERACTION_PARAMETER_INDEX_KEY, modal), ...(Reflect.getMetadata(MODAL_TEXT_INPUT_VALUE_INDEX_KEY, modal) || []), ...(Reflect.getMetadata(MODAL_SELECT_MENU_VALUE_INDEX_KEY, modal) || []), ...(Reflect.getMetadata(MODAL_FILE_UPLOAD_VALUE_INDEX_KEY, modal) || []) ];
        let args: (ModalSubmitInteraction | any)[] = Array(preArgs.length).fill(null);

        preArgs.forEach(arg => {
            if (typeof arg == "number") {
                args[arg] = itr;
            } else {
                const fieldIndex = arg as ModalFieldIndex;

                switch (fieldIndex.type) {
                    case "text_input":
                        args[arg.index] = itr.fields.getTextInputValue(fieldIndex.customId);

                        break;
                    case "select_menu":
                        const getMethods: Record<string, (customId: string) => any> = {
                            "string_select": itr.fields.getStringSelectValues,
                            "user_select": itr.fields.getSelectedUsers,
                            "role_select": itr.fields.getSelectedRoles,
                            "mentionable_select": itr.fields.getSelectedMentionables,
                            "channel_select": itr.fields.getSelectedChannels,
                            "radio_group": itr.fields.getRadioGroup,
                            "checkbox_group": itr.fields.getCheckboxGroup,
                            "checkbox": itr.fields.getCheckbox
                        };
                        
                        const label = modalComponents.find(c => c.outerType == "label" && c.innerType.endsWith("select") && c.component.data.component?.data?.custom_id == fieldIndex.customId) as ModalLabelComponentData;

                        const getMethod = getMethods[label?.innerType];

                        if (!getMethod) throw new TypeError(`Failed to get the select menu values for custom ID ${fieldIndex.customId}. Failed to gather necessary metadata.`);

                        const result = getMethod.bind(itr.fields)(fieldIndex.customId);

                        if (result instanceof Collection) args[arg.index] = result.toJSON();
                        else args[arg.index] = result;

                        break;
                    case "file_upload":
                        args[arg.index] = itr.fields.getUploadedFiles(fieldIndex.customId);

                        break;
                }
            }
        });

        if (runMethod == undefined) throw new TypeError("Failed to get the run method. Did you add the @Run decorator?");

        let cmd = new modal(...args);

        cmd[runMethod]();
    }

    /**
     * Automatically handles incoming interactions by determining their type (chat input command, context menu command, button interaction, select menu interaction, or modal submit) and routing them to the appropriate handler method. This method is called internally whenever an interaction is created.
     * @param itr The interaction to handle.
     * @returns {void}
     * @internal
     */
    #autoHandler(itr: Interaction): void {
        if (itr.isChatInputCommand()) {
            this.#chatInputCommandHandler(itr);
        } else if (itr.isContextMenuCommand()) {
            this.#contextMenuCommandHandler(itr);
        } else if (itr.isButton()) {
            this.#buttonHandler(itr);
        } else if (itr.isAnySelectMenu()) {
            this.#selectMenuHandler(itr);
        } else if (itr.isModalSubmit()) {
            this.#modalHandler(itr);
        }

        return;
    }

    /**
     * Initializes the Discord application by creating the Discord client, setting up event listeners based on the provided module, and preparing command and component handlers. This method is called internally by the `create()` method after setting the main module and options.
     * @internal
     */
    #init() {
        const options = Reflect.getMetadata(DICSORD_MODULE_OPTIONS_KEY, this.#moduleFunction) as ModuleOptions;
        const internalEvents = Reflect.getMetadata(DISCORD_MODULE_INTERNAL_EVENTS_KEY, this.#moduleFunction) as DiscordModuleEvents[];
        // const externalEvents = Reflect.getMetadata(DISCORD_MODULE_EXTERNAL_EVENTS_KEY, this.#moduleFunction) as ExternalModuleEvents[];

        this.#client = new Client(options);
        this.#module = new this.#moduleFunction(this.#client, this.#appOptions.logger!);
        this.#moduleOptions = options;

        const module = this.#module as { [key: string]: any };

        internalEvents.forEach(e => {
            this.#client.on(e.eventName, (...args: any[]) => module[e.methodName as keyof typeof module](...args));
        });

        this.#client.on("interactionCreate", (itr) => this.#autoHandler(itr));

        this.#moduleOptions.imports.forEach(module => {
            const moduleType = Reflect.getMetadata(MODULE_TYPE_KEY, module);

            switch (moduleType) {
                case ModuleType.COMMAND:
                    if (!this.#commands) this.#commands = [];
                    this.#commands.push(...Reflect.getMetadata(COMMAND_MODULE_COMMANDS_KEY, module));

                    break;
                case ModuleType.MESSAGE_COMPONENT:
                    const components = Reflect.getMetadata(MESSAGE_COMPONENT_MODULE_COMPONENTS_KEY, module) as (new (...args: any[]) => any)[];
                    const buttons = components.filter(c => Reflect.getMetadata(INTERACTION_TYPE_KEY, c) == InteractionType.BUTTON);
                    const selectMenus = components.filter(c => Reflect.getMetadata(INTERACTION_TYPE_KEY, c) == InteractionType.SELECT_MENU);
                    const modals = components.filter(c => Reflect.getMetadata(INTERACTION_TYPE_KEY, c) == InteractionType.MODAL_SUBMIT);

                    if (!this.#buttons) this.#buttons = [];
                    this.#buttons.push(...buttons);

                    if (!this.#selectMenus) this.#selectMenus = [];
                    this.#selectMenus.push(...selectMenus);

                    if (!this.#modals) this.#modals = [];
                    this.#modals.push(...modals);

                    break;
            }
        });
    }

    #setModule(discordModule: typeof BaseDiscordModule) {
        this.#moduleFunction = discordModule as (new (client: Client) => BaseDiscordModule);
    }

    #setOptions(options: DiscordAppOptions) {
        this.#appOptions = Util.mergeDefault(defaultDiscordAppOptions, options);
    }

    #mapSlashCommand(name: string, description: string, options: SlashCommandOptions[] = [], integrationTypes: ApplicationIntegrationType[] = []) {
        const requiredOptions: SlashCommandOptions[] = options.filter(o => o.required);

        const data = new SlashCommandBuilder()
            .setName(name)
            .setDescription(description);
        
        if (integrationTypes.length > 0) data.setIntegrationTypes(integrationTypes);
        
        Reflect.set(data, "options", [ ...requiredOptions, ...options.filter(o => !o.required) ]);

        this.#module.logger.info(`├─ Mapped slash command ${name}. (${(Date.now() - this.#loadStartTimestamp)}ms)`);

        return data.toJSON();
    }

    #mapContextMenuCommand(name: string, type: ContextMenuCommandType, integrationTypes: ApplicationIntegrationType[] = []) {
        const data = new ContextMenuCommandBuilder()
            .setName(name)
            .setType(type);
        
        if (integrationTypes.length > 0) data.setIntegrationTypes(integrationTypes);

        this.#module.logger.info(`├─ Mapped context command ${name}. (${(Date.now() - this.#loadStartTimestamp)}ms)`);
        
        return data.toJSON();
    }

    /**
     * Creates a new Discord application. This is the main entry point of the library. You must provide a class that extends {@link BaseDiscordModule}, which will be used as the main module of the application.
     * @param discordModule The main module of the application. This class must extend `BaseDiscordModule`.
     * @param options The options for the application.
     * @example
     * ```ts
     * import { DiscordApp } from "oopscord.js";
     * import { AppModule } from "./app.module";
     * 
     * async function bootstrap() {
     *    const app = DiscordApp.create(AppModule);
     * 
     *    await app.login();
     * }
     * 
     * bootstrap();
     * ```
     */
    static create(discordModule: typeof BaseDiscordModule, options: DiscordAppOptions = {}) {
        a1 = true;

        const app = new DiscordApp();

        app.#setModule(discordModule);
        app.#setOptions(options);
        app.#init();

        return app;
    }
}