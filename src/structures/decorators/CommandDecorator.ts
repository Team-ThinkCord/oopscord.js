import { APIApplicationCommandOptionChoice, ApplicationCommandOption, ApplicationCommandOptionAllowedChannelTypes, ChannelType, CommandInteractionOptionResolver, SlashCommandAttachmentOption, SlashCommandBooleanOption, SlashCommandChannelOption, SlashCommandIntegerOption, SlashCommandMentionableOption, SlashCommandNumberOption, SlashCommandRoleOption, SlashCommandStringOption, SlashCommandSubcommandBuilder, SlashCommandSubcommandGroupBuilder, SlashCommandUserOption, ToAPIApplicationCommandOptions } from "discord.js";
import { COMMAND_DESCRIPTION_KEY, COMMAND_NAME_KEY, COMMAND_PRIVATE_GUILD_KEY, COMMAND_PRIVATE_KEY, COMMAND_OPTIONS_KEY, OPTIONS_PARAMETER_INDEX_KEY, INTERACTION_TYPE_KEY, COMMAND_SUBCOMMANDS_KEY, COMMAND_SUBCOMMAND_GROUPS_KEY, MODULE_TYPE_KEY, ModuleType, COMMAND_MODULE_COMMANDS_KEY } from "./Constants";
import { InteractionType, SlashCommandOptions } from "../Constants";

export type CommandModuleOptions = { commands: (new (...args: any[]) => any)[] }
export type CommandOptions = { name: string, description: string }
export type BaseOptions = { name: string, description: string, required?: boolean }
export type OptionWithChoices<ValueType extends (string | number)> = BaseOptions & { choices: APIApplicationCommandOptionChoice<ValueType>[] }
export type StringOptions = BaseOptions & { minLength?: number, maxLength?: number, autocomplete?: boolean }
export type NumericOptions = BaseOptions & { minValue?: number, maxValue?: number, autocomplete?: boolean }
export type ChannelOptions = BaseOptions & { channelTypes: ApplicationCommandOptionAllowedChannelTypes[] }
export type OptionsIndex = { name: string, getMethod: keyof Omit<CommandInteractionOptionResolver, "getMessage" | "getFocused">, index: number };

// CommandModule decorator
export function CommandModule(options: CommandModuleOptions): ClassDecorator {
    return function <TFunction extends Function>(constructor: TFunction) {
        Reflect.defineMetadata(MODULE_TYPE_KEY, ModuleType.COMMAND, constructor);
        Reflect.defineMetadata(COMMAND_MODULE_COMMANDS_KEY, options.commands, constructor);
    }
}

// Define command
export function Command(option: CommandOptions): ClassDecorator {
    return function <TFunction extends Function>(constructor: TFunction) {
        Reflect.defineMetadata(INTERACTION_TYPE_KEY, InteractionType.CHAT_INPUT_COMMAND, constructor);
        Reflect.defineMetadata(COMMAND_NAME_KEY, option.name, constructor);
        Reflect.defineMetadata(COMMAND_DESCRIPTION_KEY, option.description, constructor);
    }
}

export function Subcommand(option: CommandOptions): ClassDecorator {
    return function <TFunction extends Function>(constructor: TFunction) {
        Reflect.defineMetadata(INTERACTION_TYPE_KEY, InteractionType.CHAT_INPUT_COMMAND, constructor);
        Reflect.defineMetadata(COMMAND_NAME_KEY, option.name, constructor);
        Reflect.defineMetadata(COMMAND_DESCRIPTION_KEY, option.description, constructor);
    }
}

export function Private(isPrivate: boolean = true, guild?: string) {
    if (isPrivate && !guild) throw new TypeError("You must provide guild id if isPrivate is true.");

    return function <TFunction extends Function>(constructor: TFunction) {
        Reflect.defineMetadata(COMMAND_PRIVATE_KEY, isPrivate, constructor);
        Reflect.defineMetadata(COMMAND_PRIVATE_GUILD_KEY, guild, constructor);
    }
}

// Options
export function AddSubcommand(subcommand: Function) {
    return function <T extends Function>(constructor: T) {
        const options: ToAPIApplicationCommandOptions[] = Reflect.getMetadata(COMMAND_OPTIONS_KEY, constructor) || [];
        const subcommands: Function[] = Reflect.getMetadata(COMMAND_SUBCOMMANDS_KEY, constructor) || [];

        const name: string = Reflect.getMetadata(COMMAND_NAME_KEY, subcommand);
        const description: string = Reflect.getMetadata(COMMAND_DESCRIPTION_KEY, subcommand);
        const options1: ToAPIApplicationCommandOptions[] = Reflect.getMetadata(COMMAND_OPTIONS_KEY, subcommand) ?? [];

        const data = new SlashCommandSubcommandBuilder()
            .setName(name)
            .setDescription(description);

        Reflect.set(data, "options", options1);

        options.push(data);
        subcommands.push(subcommand);

        Reflect.defineMetadata(COMMAND_OPTIONS_KEY, options, constructor);
        Reflect.defineMetadata(COMMAND_SUBCOMMANDS_KEY, subcommands, constructor);
    }
}

export function AddSubcommandGroup(option: BaseOptions, ...subcommands: Function[]) {
    return function <T extends Function>(constructor: T) {
        const options: ToAPIApplicationCommandOptions[] = Reflect.getMetadata(COMMAND_OPTIONS_KEY, constructor) || [];
        const subcommandGroups: { [groupName: string]: Function[] } = Reflect.getMetadata(COMMAND_SUBCOMMAND_GROUPS_KEY, constructor) || {};

        const subcommands1 = subcommands.map(subcommand => {
            const name: string = Reflect.getMetadata(COMMAND_NAME_KEY, subcommand);
            const description: string = Reflect.getMetadata(COMMAND_DESCRIPTION_KEY, subcommand);
            const options1: ToAPIApplicationCommandOptions[] = Reflect.getMetadata(COMMAND_OPTIONS_KEY, subcommand) ?? [];

            const data = new SlashCommandSubcommandBuilder()
                .setName(name)
                .setDescription(description);

            Reflect.set(data, "options", options1);

            return data;
        });

        const data = new SlashCommandSubcommandGroupBuilder()
            .setName(option.name)
            .setDescription(option.description);

        Reflect.set(data, "options", subcommands1);

        if (!Array.isArray(subcommandGroups[option.name])) subcommandGroups[option.name] = [];
        subcommandGroups[option.name].push(...subcommands);

        options.push(data);

        Reflect.defineMetadata(COMMAND_OPTIONS_KEY, options, constructor);
        Reflect.defineMetadata(COMMAND_SUBCOMMAND_GROUPS_KEY, subcommandGroups, constructor);
    }
}

export function StringOption(option: StringOptions): ClassDecorator {
    return function <T extends Function>(constructor: T) {
        const options: SlashCommandOptions[] = Reflect.getMetadata(COMMAND_OPTIONS_KEY, constructor) || [];

        options.push(
            new SlashCommandStringOption()
                .setName(option.name)
                .setDescription(option.description)
                .setRequired(option.required ?? false)
                .setAutocomplete(option.autocomplete ?? false)
                .setMinLength(option.minLength ?? 0)
                .setMaxLength(option.maxLength ?? 6000)
        );

        Reflect.defineMetadata(COMMAND_OPTIONS_KEY, options, constructor);
    }
}

export function StringOptionWithChoices(option: OptionWithChoices<string>): ClassDecorator {
    return function <T extends Function>(constructor: T) {
        const options: SlashCommandOptions[] = Reflect.getMetadata(COMMAND_OPTIONS_KEY, constructor) || [];

        options.push(
            new SlashCommandStringOption()
                .setName(option.name)
                .setDescription(option.description)
                .setRequired(option.required ?? false)
                .setChoices(...option.choices)
        );

        Reflect.defineMetadata(COMMAND_OPTIONS_KEY, options, constructor);

    }
}

export function IntegerOption(option: NumericOptions): ClassDecorator {
    return function <T extends Function>(constructor: T) {
        const options: SlashCommandOptions[] = Reflect.getMetadata(COMMAND_OPTIONS_KEY, constructor) || [];

        options.push(
            new SlashCommandIntegerOption()
                .setName(option.name)
                .setDescription(option.description)
                .setRequired(option.required ?? false)
                .setAutocomplete(option.autocomplete ?? false)
                .setMinValue(option.minValue ?? -2147483648)
                .setMaxValue(option.maxValue ?? 2147483647)
        );

        Reflect.defineMetadata(COMMAND_OPTIONS_KEY, options, constructor);
    }
}

export function IntegerOptionWithChoices(option: OptionWithChoices<number>): ClassDecorator {
    return function <T extends Function>(constructor: T) {
        const options: SlashCommandOptions[] = Reflect.getMetadata(COMMAND_OPTIONS_KEY, constructor) || [];

        options.push(
            new SlashCommandIntegerOption()
                .setName(option.name)
                .setDescription(option.description)
                .setRequired(option.required ?? false)
                .setChoices(...option.choices)
        );

        Reflect.defineMetadata(COMMAND_OPTIONS_KEY, options, constructor);
    }
}

export function NumberOption(option: NumericOptions): ClassDecorator {
    return function <T extends Function>(constructor: T) {
        const options: SlashCommandOptions[] = Reflect.getMetadata(COMMAND_OPTIONS_KEY, constructor) || [];

        options.push(
            new SlashCommandNumberOption()
                .setName(option.name)
                .setDescription(option.description)
                .setRequired(option.required ?? false)
                .setAutocomplete(option.autocomplete ?? false)
                .setMinValue(option.minValue ?? -2147483648)
                .setMaxValue(option.maxValue ?? 2147483647)
        );

        Reflect.defineMetadata(COMMAND_OPTIONS_KEY, options, constructor);
    }
}

export function NumberOptionWithChoices(option: OptionWithChoices<number>): ClassDecorator {
    return function <T extends Function>(constructor: T) {
        const options: SlashCommandOptions[] = Reflect.getMetadata(COMMAND_OPTIONS_KEY, constructor) || [];

        options.push(
            new SlashCommandNumberOption()
                .setName(option.name)
                .setDescription(option.description)
                .setRequired(option.required ?? false)
                .setChoices(...option.choices)
        );

        Reflect.defineMetadata(COMMAND_OPTIONS_KEY, options, constructor);
    }
}

export function BooleanOption(option: BaseOptions) {
    return function <T extends Function>(constructor: T) {
        const options: SlashCommandOptions[] = Reflect.getMetadata(COMMAND_OPTIONS_KEY, constructor) || [];

        options.push(
            new SlashCommandBooleanOption()
                .setName(option.name)
                .setDescription(option.description)
                .setRequired(option.required ?? false)
        );

        Reflect.defineMetadata(COMMAND_OPTIONS_KEY, options, constructor);
    }
}

export function UserOption(option: BaseOptions) {
    return function <T extends Function>(constructor: T) {
        const options: SlashCommandOptions[] = Reflect.getMetadata(COMMAND_OPTIONS_KEY, constructor) || [];

        options.push(
            new SlashCommandUserOption()
                .setName(option.name)
                .setDescription(option.description)
                .setRequired(option.required ?? false)
        );

        Reflect.defineMetadata(COMMAND_OPTIONS_KEY, options, constructor);
    }
}

export function ChannelOption(option: ChannelOptions) {
    return function <T extends Function>(constructor: T) {
        const options: SlashCommandOptions[] = Reflect.getMetadata(COMMAND_OPTIONS_KEY, constructor) || [];

        options.push(
            new SlashCommandChannelOption()
                .setName(option.name)
                .setDescription(option.description)
                .setRequired(option.required ?? false)
                .addChannelTypes(...option.channelTypes ?? [
                    ChannelType.GuildText,
                    ChannelType.GuildVoice,
                    ChannelType.GuildCategory,
                    ChannelType.GuildAnnouncement,
                    ChannelType.AnnouncementThread,
                    ChannelType.PublicThread,
                    ChannelType.PrivateThread,
                    ChannelType.GuildStageVoice,
                    ChannelType.GuildForum,
                ])
        );

        Reflect.defineMetadata(COMMAND_OPTIONS_KEY, options, constructor);
    }
}

export function RoleOption(option: BaseOptions) {
    return function <T extends Function>(constructor: T) {
        const options: SlashCommandOptions[] = Reflect.getMetadata(COMMAND_OPTIONS_KEY, constructor) || [];

        options.push(
            new SlashCommandRoleOption()
                .setName(option.name)
                .setDescription(option.description)
                .setRequired(option.required ?? false)
        );

        Reflect.defineMetadata(COMMAND_OPTIONS_KEY, options, constructor);
    }
}

export function MentionableOption(option: BaseOptions) {
    return function <T extends Function>(constructor: T) {
        const options: SlashCommandOptions[] = Reflect.getMetadata(COMMAND_OPTIONS_KEY, constructor) || [];

        options.push(
            new SlashCommandMentionableOption()
                .setName(option.name)
                .setDescription(option.description)
                .setRequired(option.required ?? false)
        );

        Reflect.defineMetadata(COMMAND_OPTIONS_KEY, options, constructor);
    }
}

export function AttachmentOption(option: BaseOptions) {
    return function <T extends Function>(constructor: T) {
        const options: SlashCommandOptions[] = Reflect.getMetadata(COMMAND_OPTIONS_KEY, constructor) || [];

        options.push(
            new SlashCommandAttachmentOption()
                .setName(option.name)
                .setDescription(option.description)
                .setRequired(option.required ?? false)
        );

        Reflect.defineMetadata(COMMAND_OPTIONS_KEY, options, constructor);
    }
}

// Injection

export function StringOptionInjection(name: string) {
    return function (target: Object, _propertyKey: string | symbol | undefined, parameterIndex: number) {
        const constructor = target;
        const optionsIndexArray: OptionsIndex[] = Reflect.getMetadata(OPTIONS_PARAMETER_INDEX_KEY, constructor) || [];

        optionsIndexArray.push({ name, getMethod: "getString", index: parameterIndex });

        Reflect.defineMetadata(OPTIONS_PARAMETER_INDEX_KEY, optionsIndexArray, constructor);
    }
}

export function IntegerOptionInjection(name: string) {
    return function (target: Object, _propertyKey: string | symbol | undefined, parameterIndex: number) {
        const constructor = target;
        const optionsIndexArray: OptionsIndex[] = Reflect.getMetadata(OPTIONS_PARAMETER_INDEX_KEY, constructor) || [];

        optionsIndexArray.push({ name, getMethod: "getInteger", index: parameterIndex });

        Reflect.defineMetadata(OPTIONS_PARAMETER_INDEX_KEY, optionsIndexArray, constructor);
    }
}

export function NumberOptionInjection(name: string) {
    return function (target: Object, _propertyKey: string | symbol | undefined, parameterIndex: number) {
        const constructor = target;
        const optionsIndexArray: OptionsIndex[] = Reflect.getMetadata(OPTIONS_PARAMETER_INDEX_KEY, constructor) || [];

        optionsIndexArray.push({ name, getMethod: "getNumber", index: parameterIndex });

        Reflect.defineMetadata(OPTIONS_PARAMETER_INDEX_KEY, optionsIndexArray, constructor);
    }
}

export function BooleanOptionInjection(name: string) {
    return function (target: Object, _propertyKey: string | symbol | undefined, parameterIndex: number) {
        const constructor = target;
        const optionsIndexArray: OptionsIndex[] = Reflect.getMetadata(OPTIONS_PARAMETER_INDEX_KEY, constructor) || [];

        optionsIndexArray.push({ name, getMethod: "getBoolean", index: parameterIndex });

        Reflect.defineMetadata(OPTIONS_PARAMETER_INDEX_KEY, optionsIndexArray, constructor);
    }
}

export function UserOptionInjection(name: string) {
    return function (target: Object, _propertyKey: string | symbol | undefined, parameterIndex: number) {
        const constructor = target;
        const optionsIndexArray: OptionsIndex[] = Reflect.getMetadata(OPTIONS_PARAMETER_INDEX_KEY, constructor) || [];

        optionsIndexArray.push({ name, getMethod: "getUser", index: parameterIndex });

        Reflect.defineMetadata(OPTIONS_PARAMETER_INDEX_KEY, optionsIndexArray, constructor);
    }
}

export function ChannelOptionInjection(name: string) {
    return function (target: Object, _propertyKey: string | symbol | undefined, parameterIndex: number) {
        const constructor = target;
        const optionsIndexArray: OptionsIndex[] = Reflect.getMetadata(OPTIONS_PARAMETER_INDEX_KEY, constructor) || [];

        optionsIndexArray.push({ name, getMethod: "getChannel", index: parameterIndex });

        Reflect.defineMetadata(OPTIONS_PARAMETER_INDEX_KEY, optionsIndexArray, constructor);
    }
}

export function RoleOptionInjection(name: string) {
    return function (target: Object, _propertyKey: string | symbol | undefined, parameterIndex: number) {
        const constructor = target;
        const optionsIndexArray: OptionsIndex[] = Reflect.getMetadata(OPTIONS_PARAMETER_INDEX_KEY, constructor) || [];

        optionsIndexArray.push({ name, getMethod: "getRole", index: parameterIndex });

        Reflect.defineMetadata(OPTIONS_PARAMETER_INDEX_KEY, optionsIndexArray, constructor);
    }
}

export function MentionableOptionInjection(name: string) {
    return function (target: Object, _propertyKey: string | symbol | undefined, parameterIndex: number) {
        const constructor = target;
        const optionsIndexArray: OptionsIndex[] = Reflect.getMetadata(OPTIONS_PARAMETER_INDEX_KEY, constructor) || [];

        optionsIndexArray.push({ name, getMethod: "getMentionable", index: parameterIndex });

        Reflect.defineMetadata(OPTIONS_PARAMETER_INDEX_KEY, optionsIndexArray, constructor);
    }
}

export function AttachmentOptionInjection(name: string) {
    return function (target: Object, _propertyKey: string | symbol | undefined, parameterIndex: number) {
        const constructor = target;
        const optionsIndexArray: OptionsIndex[] = Reflect.getMetadata(OPTIONS_PARAMETER_INDEX_KEY, constructor) || [];

        optionsIndexArray.push({ name, getMethod: "getAttachment", index: parameterIndex });

        Reflect.defineMetadata(OPTIONS_PARAMETER_INDEX_KEY, optionsIndexArray, constructor);
    }
}