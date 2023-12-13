import { SlashCommandAttachmentOption, SlashCommandBooleanOption, SlashCommandChannelOption, SlashCommandIntegerOption, SlashCommandMentionableOption, SlashCommandNumberOption, SlashCommandRoleOption, SlashCommandStringOption, SlashCommandUserOption } from "discord.js";

export type SlashCommandOptions =
    SlashCommandAttachmentOption |
    SlashCommandBooleanOption |
    SlashCommandBooleanOption |
    SlashCommandChannelOption |
    SlashCommandIntegerOption | 
    SlashCommandMentionableOption |
    SlashCommandNumberOption |
    SlashCommandRoleOption |
    SlashCommandStringOption |
    SlashCommandUserOption;

export enum InteractionType {
    CHAT_INPUT_COMMAND,
    CONTEXT_MENU_COMMAND,
    BUTTON,
    SELECT_MENU,
    MODAL_SUBMIT
}