// SPDX-License-Identifier: GPL-3.0-or-later

export class MathUtils {
    /**
     * Calculates the non-negative modulo of two numbers.
     * @param {number} dividend 
     * @param {number} divisor 
     * @returns {number}
     */
    static moduloUnsigned(dividend, divisor) {
        var result = dividend % divisor;
        return result < 0 ? result + divisor : result;
    }
}

export { MathUtils as MU }