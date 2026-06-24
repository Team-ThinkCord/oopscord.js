/**
 * Marker class for event listeners. This class is used to identify event listener classes in the event module system.
 * 
 * @example
 * ```ts
 * import { Listener } from "oopscord.js";
 * 
 * class MyListener extends Listener {
 *     ＠EventHandler("messageCreate")
 *     onMessageCreate(message: Message) {
 *         message.reply("Hello, World!");
 *     }
 * }
 * ```
 */
export class Listener {}