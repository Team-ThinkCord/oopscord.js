import { ApplicationCommandOption, ChatInputCommandInteraction, Client, ClientEvents, Interaction, REST, RESTPostAPIApplicationCommandsJSONBody, Routes, SlashCommandBuilder } from "discord.js";
import {  DiscordModuleEvents,  ModuleOptions } from "./decorators/DiscordModuleDecorator";
import { COMMAND_DESCRIPTION_KEY, COMMAND_NAME_KEY, COMMAND_PRIVATE_KEY, DICSORD_MODULE_OPTIONS_KEY, DISCORD_MODULE_INTERNAL_EVENTS_KEY, INTERACTION_TYPE_KEY, COMMAND_OPTIONS_KEY, COMMAND_PRIVATE_GUILD_KEY, INTERACTION_RUN_METHOD_KEY, OPTIONS_PARAMETER_INDEX_KEY, INTERACTION_PARAMETER_INDEX_KEY, COMMAND_SUBCOMMAND_GROUPS_KEY, COMMAND_SUBCOMMANDS_KEY, MODULE_TYPE_KEY, ModuleType, COMMAND_MODULE_COMMANDS_KEY } from "./decorators/Constants";
import { InteractionType } from "./Constants";
import { OptionsIndex } from "./decorators/CommandDecorator";

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

    constructor() {
        if (!a1) throw new ReferenceError("Please use DiscordApp.create()");

        a1 = false;

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

                return data.toJSON();
            });

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
            });

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
                this.#appOptions.logger?.info(`Successfully registered global commands.`);

                for (const guildId in apiPrivateCommands) {
                    await this.#rest.put(
                        Routes.applicationGuildCommands(this.#client.user!.id, guildId),
                        { body: apiPrivateCommands[guildId] }
                    );

                    this.#appOptions.logger?.info(`Successfully registered private commands in ${guildId}.`);
                }
            }
        } catch (err) {
            this.#appOptions.logger?.warn("Failed to deploy commands.");
            this.#appOptions.logger?.warn((err as Error).stack!);
        }
    }

    #chatInputCommandHandler(itr: ChatInputCommandInteraction) {
        const commands = this.#commands.filter(i => Reflect.getMetadata(INTERACTION_TYPE_KEY, i) == InteractionType.CHAT_INPUT_COMMAND);

        const commandName = itr.commandName;
        const command = commands.find(c => Reflect.getMetadata(COMMAND_NAME_KEY, c) == commandName);

        if (!command) return;

        if (itr.options.getSubcommandGroup()) {
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
        } else if (itr.options.getSubcommand()) {
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

    #autoHandler(itr: Interaction) {
        if (itr.isChatInputCommand()) {
            this.#chatInputCommandHandler(itr);
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
            this.#client.on(e.eventName, module[e.methodName as keyof typeof module]!!);
        });

        this.#client.on("interactionCreate", (itr) => this.#autoHandler(itr));

        this.#moduleOptions.imports.forEach(module => {
            const moduleType = Reflect.getMetadata(MODULE_TYPE_KEY, module);

            switch (moduleType) {
                case ModuleType.COMMAND:
                    if (!this.#commands) this.#commands = [];
                    this.#commands.push(Reflect.getMetadata(COMMAND_MODULE_COMMANDS_KEY, module));

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