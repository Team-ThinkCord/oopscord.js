export const MODULE_TYPE_KEY = Symbol("type");

export const COMMAND_MODULE_COMMANDS_KEY = Symbol("commands");

export const INTERACTION_RUN_METHOD_KEY = Symbol("run_method");
export const INTERACTION_PARAMETER_INDEX_KEY = Symbol("interaction_parameter_index");
export const INTERACTION_TYPE_KEY = Symbol("type");

export const COMMAND_NAME_KEY = Symbol("name");
export const COMMAND_DESCRIPTION_KEY = Symbol("description");
export const COMMAND_PRIVATE_KEY = Symbol("private");
export const COMMAND_PRIVATE_GUILD_KEY = Symbol("private_guild");
export const COMMAND_OPTIONS_KEY = Symbol("options");
export const COMMAND_SUBCOMMAND_GROUPS_KEY = Symbol("subcommand_groups");
export const COMMAND_SUBCOMMANDS_KEY = Symbol("subcommands");
export const OPTIONS_PARAMETER_INDEX_KEY = Symbol("options_parameter_index");
export const DICSORD_MODULE_OPTIONS_KEY = Symbol("options");
export const DISCORD_MODULE_INTERNAL_EVENTS_KEY = Symbol("internal_events");
export const DISCORD_MODULE_EXTERNAL_EVENTS_KEY = Symbol("external_events");

export const BUTTON_OPTIONS_KEY = Symbol("options");

export const SELECT_MENU_OPTIONS_KEY = Symbol("options");

export enum ModuleType {
    COMMAND,
    MESSAGE_COMPONENT
}