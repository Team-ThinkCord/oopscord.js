import { ClientEvents } from "discord.js";
import { EVENT_MODULE_LISTENERS_KEY, INTERNAL_EVENTS_KEY, MODULE_TYPE_KEY, ModuleType } from "./Constants";
import { DiscordModuleEvents } from "./DiscordModuleDecorator";
import { Listener } from "../components/Listener";

/**
 * Configuration for the `EventModule` decorator.
 *
 * - `listeners`: an array of listener classes (constructors) that the
 *   module system can instantiate and register when this module is loaded.
 */
export interface EventModuleOptions {
    listeners?: typeof Listener[]
}

/**
 * Class decorator that marks a class as an event module.
 *
 * The decorator is intended to be used by the module loader to discover
 * and register event listener classes associated with a module. It stores
 * configuration on the class (via metadata) so runtime code can act on it.
 *
 * @param options - Options describing listener classes to register
 * @example
 * ```ts
 * ＠EventModule({ listeners: [MyListener, OtherListener] })
 * class MyModule {}
 * ```
 */
export function EventModule(options: EventModuleOptions): ClassDecorator {
    return function<TFunction extends Function>(constructor: TFunction) {
        Reflect.defineMetadata(MODULE_TYPE_KEY, ModuleType.EVENT, constructor);
        Reflect.defineMetadata(EVENT_MODULE_LISTENERS_KEY, options.listeners ?? [], constructor);
    }
}

/**
 * Decorator that registers a method as an event handler for a Discord client event.
 * 
 * @param eventName - The name of the Discord client event to listen for
 * @returns A method decorator that registers the decorated method as an event handler
 * 
 * @example
 * ```typescript
 * class MyModule {
 *   ＠EventHandler('messageCreate')
 *   onMessageCreate(message: Message) {
 *     // Handle message creation
 *   }
 * }
 * ```
 */
export function EventHandler(eventName: keyof ClientEvents): MethodDecorator {
    return function<T>(target: Object, propertyKey: string | symbol, propertyDescriptor: TypedPropertyDescriptor<T>) {
        const events: DiscordModuleEvents[] = Reflect.getMetadata(INTERNAL_EVENTS_KEY, target.constructor) ?? [];

        events.push({ eventName, methodName: propertyKey as string });

        Reflect.defineMetadata(INTERNAL_EVENTS_KEY, events, target.constructor);
    }
}