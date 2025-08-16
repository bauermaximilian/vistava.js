// SPDX-License-Identifier: GPL-3.0-or-later

export class TimeoutError extends Error {
    /**
     * @param {string} [message]
     */
    constructor(message) {
       super(message ?? "The operation timed out.");
    }
 }