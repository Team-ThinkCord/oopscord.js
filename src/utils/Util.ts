import { ButtonStyle } from "discord-api-types/v10";
import { InteractionButtonOptions, LinkButtonOptions } from "../structures/decorators/MessageComponentDecorator";

export class Util {
    static isInteractionButtonOptions(options: InteractionButtonOptions | LinkButtonOptions): options is InteractionButtonOptions {
        return options.style != ButtonStyle.Link;
    }

    static mergeDefault<T extends { [key: PropertyKey]: any }>(def: T, given: Partial<T>): T {
        if (!given) return def;

        for (const key in def) {
            if (!Object.hasOwn(given, key) || given[key] === undefined) {
                given[key] = def[key];
            } else if (given[key] === Object(given[key])) {
                given[key] = this.mergeDefault(def[key], given[key]);
            }
        }

        return given as T;
    }
}