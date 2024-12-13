import { AnySelectMenuInteraction, ApplicationCommandOption, ButtonInteraction, ChatInputCommandInteraction, Client, ClientEvents, Interaction, ModalSubmitInteraction, REST, SlashCommandBuilder } from "discord.js";
import { RESTPostAPIApplicationCommandsJSONBody, Routes } from "discord-api-types/v10";
import { DiscordModuleEvents,  ModuleOptions } from "./decorators/DiscordModuleDecorator";
import { COMMAND_DESCRIPTION_KEY, COMMAND_NAME_KEY, COMMAND_PRIVATE_KEY, DICSORD_MODULE_OPTIONS_KEY, DISCORD_MODULE_INTERNAL_EVENTS_KEY, INTERACTION_TYPE_KEY, COMMAND_OPTIONS_KEY, COMMAND_PRIVATE_GUILD_KEY, INTERACTION_RUN_METHOD_KEY, OPTIONS_PARAMETER_INDEX_KEY, INTERACTION_PARAMETER_INDEX_KEY, COMMAND_SUBCOMMAND_GROUPS_KEY, COMMAND_SUBCOMMANDS_KEY, MODULE_TYPE_KEY, ModuleType, COMMAND_MODULE_COMMANDS_KEY, MESSAGE_COMPONENT_MODULE_COMPONENTS_KEY, BUTTON_OPTIONS_KEY, SELECT_MENU_OPTIONS_KEY, MODAL_OPTIONS_KEY, MODAL_FIELD_INDEX_KEY } from "./decorators/Constants";
import { InteractionType } from "./Constants";
import { OptionsIndex } from "./decorators/CommandDecorator";
import { FieldIndex, Plugin } from ".";

export interface Logger {
    info(message: string): void;
    trace(message: string): void;
    warn(message: string): void;
    error(message: string): void;
    trace(message: string): void;
}

export interface DiscordAppOptions {
    logger?: Logger;
    plugins?: Plugin[]
}

const defaultDiscordAppOptions: DiscordAppOptions = {
    logger: console,
    plugins: []
}

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

    async login() {
        this.#rest.setToken(this.#moduleOptions.token);

        await this.#client.login(this.#moduleOptions.token);

        try {
            const commands = this.#commands.filter(i => Reflect.getMetadata(INTERACTION_TYPE_KEY, i) == InteractionType.CHAT_INPUT_COMMAND);
            const privateCommands = commands.filter(c => Reflect.getMetadata(COMMAND_PRIVATE_KEY, c));
            const globalCommands = commands.filter(c => !Reflect.getMetadata(COMMAND_PRIVATE_KEY, c));

            // Prepare global commands
            const apiGlobalCommands: RESTPostAPIApplicationCommandsJSONBody[] = globalCommands.map(c => {
                const name: string = Reflect.getMetadata(COMMAND_NAME_KEY, c);
                const description: string = Reflect.getMetadata(COMMAND_DESCRIPTION_KEY, c);
                const options: ApplicationCommandOption[] = Reflect.getMetadata(COMMAND_OPTIONS_KEY, c) ?? [];

                const data = new SlashCommandBuilder()
                    .setName(name)
                    .setDescription(description);
                
                Reflect.set(data, "options", options);

                this.#module.logger.info(`Mapped global command ${name}.`);

                return data.toJSON();
            });

            this.#module.logger.info(`Mapped ${apiGlobalCommands.length} global command(s).`);

            // Prepare private commands
            const apiPrivateCommands: { [guildId: string]: RESTPostAPIApplicationCommandsJSONBody[] } = {}

            privateCommands.forEach(c => {
                const guildId: string = Reflect.getMetadata(COMMAND_PRIVATE_GUILD_KEY, c);

                const name: string = Reflect.getMetadata(COMMAND_NAME_KEY, c);
                const description: string = Reflect.getMetadata(COMMAND_DESCRIPTION_KEY, c);
                const options: ApplicationCommandOption[] = Reflect.getMetadata(COMMAND_OPTIONS_KEY, c) ?? [];

                const data = new SlashCommandBuilder()
                    .setName(name)
                    .setDescription(description);
                
                Reflect.set(data, "options", options);

                if (!Array.isArray(apiPrivateCommands[guildId])) apiPrivateCommands[guildId] = [];

                apiPrivateCommands[guildId].push(data.toJSON());

                this.#module.logger.info(`Mapped private command ${name} in ${guildId}.`);
            });

            const wholePrivateCommands = Object.values(apiPrivateCommands).flat();

            this.#module.logger.info(`Mapped ${Object.keys(apiPrivateCommands).length} guild(s) with ${wholePrivateCommands.length} private command(s).`);

            if (this.#moduleOptions.test!.enable) {
                await this.#rest.put(
                    Routes.applicationGuildCommands(this.#client.user!.id, this.#moduleOptions.test!.guild!),
                    { body: apiGlobalCommands }
                );
            } else {
                await this.#rest.put(
                    Routes.applicationCommands(this.#client.user!.id),
                    { body: apiGlobalCommands }
                );
                this.#module.logger.info(`Successfully registered global commands.`);

                for (const guildId in apiPrivateCommands) {
                    await this.#rest.put(
                        Routes.applicationGuildCommands(this.#client.user!.id, guildId),
                        { body: apiPrivateCommands[guildId] }
                    );

                    this.#module.logger.info(`Successfully registered private commands in ${guildId}.`);
                }
            }
        } catch (err) {
            this.#module.logger.warn("Failed to deploy commands.");
            this.#module.logger.warn((err as Error).stack!);
        }

        this.#module.logger.info("Application took " + (Date.now() - this.#loadStartTimestamp) + "ms to load.");
    }

    #chatInputCommandHandler(itr: ChatInputCommandInteraction) {
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

            preArgs.forEach(arg => {
                if (typeof arg == "number") args[arg] = itr;
                else args[arg.index] = (itr.options[arg.getMethod] as (name: string) => any)(arg.name)
            });

            let cmd = new command(...args);

            cmd[runMethod]();
        }
    }

    #buttonHandler(itr: ButtonInteraction) {
        const button = this.#buttons.find(b => Reflect.getMetadata(BUTTON_OPTIONS_KEY, b).customId == itr.customId);

        if (!button) return;

        let runMethod: string = Reflect.getMetadata(INTERACTION_RUN_METHOD_KEY, button);

        let cmd = new button(itr);

        cmd[runMethod]();
    }

    #selectMenuHandler(itr: AnySelectMenuInteraction) {
        const selectMenu = this.#selectMenus.find(b => Reflect.getMetadata(SELECT_MENU_OPTIONS_KEY, b).customId == itr.customId);

        if (!selectMenu) return;

        let runMethod: string = Reflect.getMetadata(INTERACTION_RUN_METHOD_KEY, selectMenu);

        let cmd = new selectMenu(itr);

        cmd[runMethod]();
    }

    #modalHandler(itr: ModalSubmitInteraction) {
        const modal = this.#modals.find(b => Reflect.getMetadata(MODAL_OPTIONS_KEY, b).customId == itr.customId);

        if (!modal) return;

        let runMethod: string = Reflect.getMetadata(INTERACTION_RUN_METHOD_KEY, modal);
        let preArgs: (number | FieldIndex)[] = [ Reflect.getMetadata(INTERACTION_PARAMETER_INDEX_KEY, modal), ...(Reflect.getMetadata(MODAL_FIELD_INDEX_KEY, modal) || []) ];
        let args: (ModalSubmitInteraction | any)[] = Array(preArgs.length).fill(null);

        preArgs.forEach(arg => {
            if (typeof arg == "number") args[arg] = itr;
            else args[arg.index] = itr.fields.getTextInputValue(arg.customId);
        });

        let cmd = new modal(...args);

        cmd[runMethod]();
    }

    #autoHandler(itr: Interaction) {
        if (itr.isChatInputCommand()) {
            this.#chatInputCommandHandler(itr);
        } else if (itr.isButton()) {
            this.#buttonHandler(itr);
        } else if (itr.isAnySelectMenu()) {
            this.#selectMenuHandler(itr);
        } else if (itr.isModalSubmit()) {
            this.#modalHandler(itr);
        }
    }

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
        this.#appOptions = mergeDefault(defaultDiscordAppOptions, options);
    }

    static create(discordModule: typeof BaseDiscordModule, options: DiscordAppOptions = {}) {
        a1 = true;

        const app = new DiscordApp();

        app.#setModule(discordModule);
        app.#setOptions(options);
        app.#init();

        return app;
    }
}

function mergeDefault<T extends { [key: string | symbol]: any }>(def: T, given: T) {
    if (!given) return def;
    for (const key in def) {
        if (!Object.hasOwn(given, key) || given[key] === undefined) {
            given[key] = def[key];
        } else if (given[key] === Object(given[key])) {
            given[key] = mergeDefault(def[key], given[key]);
        }
    }

    return given;
}