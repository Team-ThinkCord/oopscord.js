import { APIStringSelectComponent, ChannelSelectMenuBuilder, ComponentType, MentionableSelectMenuBuilder, RoleSelectMenuBuilder, StringSelectMenuBuilder, UserSelectMenuBuilder } from "discord.js";
import { BaseSelectMenuOptions, ChannelSelectMenuOptions, MentionableSelectMenuOptions, RoleSelectMenuOptions, SELECT_MENU_OPTIONS_KEY, SELECT_MENU_TYPE_KEY, StringSelectMenuOptions, UserSelectMenuOptions } from "..";

export class BaseSelectMenu {
    static selelctMenu: StringSelectMenuBuilder | UserSelectMenuBuilder | RoleSelectMenuBuilder | ChannelSelectMenuBuilder | MentionableSelectMenuBuilder | null = null;

    static getSelectMenu() {
        if (this.selelctMenu) return this.selelctMenu;

        let selectMenu: StringSelectMenuBuilder | UserSelectMenuBuilder | RoleSelectMenuBuilder | ChannelSelectMenuBuilder | MentionableSelectMenuBuilder;

        const type = Reflect.getMetadata(SELECT_MENU_TYPE_KEY, this.constructor) as string;
        const options = Reflect.getMetadata(SELECT_MENU_OPTIONS_KEY, this.constructor) as BaseSelectMenuOptions;

        if (!options) throw new TypeError("Failed to get the select menu.");

        switch (type) {
            case "string":
                selectMenu = new StringSelectMenuBuilder()
                    .addOptions((options as StringSelectMenuOptions).options);
                break;
            case "user":
                selectMenu = new UserSelectMenuBuilder()
                    .setDefaultUsers((options as UserSelectMenuOptions).defaultUsers ?? []);
                break;
            case "role":
                selectMenu = new RoleSelectMenuBuilder()
                    .setDefaultRoles((options as RoleSelectMenuOptions).defaultRoles ?? []);
                break;
            case "channel":
                selectMenu = new ChannelSelectMenuBuilder()
                    .setDefaultChannels((options as ChannelSelectMenuOptions).defaultChannels ?? []);
                break;
            case "mentionable":
                const opts = options as MentionableSelectMenuOptions;
                selectMenu = new MentionableSelectMenuBuilder()
                    .addDefaultUsers(opts.defaultUsers ?? [])
                    .addDefaultRoles(opts.defaultRoles ?? []);
                break;
            default:
                throw new TypeError("Invalid select menu type.");
        }

        selectMenu
            .setCustomId(options.customId)
            .setPlaceholder(options.placeholder);

        if (options.disabled) selectMenu.setDisabled(options.disabled);
        if (typeof options.minValues == 'number') selectMenu.setMinValues(options.minValues);
        if (typeof options.maxValues == 'number') selectMenu.setMaxValues(options.maxValues);

        this.selelctMenu = selectMenu;

        return selectMenu;
    }

    static withValues(...values: { label: string, value: string, description?: string, emoji?: string }[]) {
        if (this.getSelectMenu().data.type != ComponentType.StringSelect) throw new TypeError("withValues is only available for StringSelectMenu.");

        const selectMenu = StringSelectMenuBuilder.from(this.getSelectMenu().toJSON() as APIStringSelectComponent);

        selectMenu.setOptions(values);

        return selectMenu;
    }
}