import { Injectable } from '@angular/core';
import { SESSION_STORAGE_VARIATION_KEY } from '@dotcms/dotcms-models';

@Injectable()
export class DotSessionStorageService {
    /**
     * Set the variantId to the SessionStorage Key
     *
     * @param {string} variationId
     * @memberof DotSessionStorageService
     */
    setVariationId(variationId: string): void {
        sessionStorage.setItem(SESSION_STORAGE_VARIATION_KEY, variationId);
    }

    /**
     * Get the variationId from the SessionStorage Key
     *
     * @return {*}  {(string | null)}
     * @memberof DotSessionStorageService
     */
    getVariationId(): string | null {
        if (typeof SESSION_STORAGE_VARIATION_KEY === 'string') {
            return sessionStorage.getItem(SESSION_STORAGE_VARIATION_KEY);
        }

        return null;
    }

    /**
     * Remove the variation of the SessionStorage Key
     *
     * @memberof DotSessionStorageService
     */
    removeVariationId(): void {
        sessionStorage.removeItem(SESSION_STORAGE_VARIATION_KEY);
    }
}
