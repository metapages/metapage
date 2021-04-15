import { delay } from "https://deno.land/std@0.83.0/async/delay.ts";

/**
 * interval       default 500ms
 * requestTimeout default 2000ms
 * @param props
 */
export async function waitOn200StatusFromUrl(props: { url: string, interval?: number, requestTimeout?: number, headers?: { [key: string]: string } }): Promise<void> {
    let { url, interval, requestTimeout, headers } = props;
    interval = interval ? interval : 500;
    requestTimeout = requestTimeout ? requestTimeout : 2000;

    const get = async () => {
        try {

            const response = await fetch(url, {
                method: "GET",
                headers: headers
            });
            return response.status;
        } catch (err) {
            return 0;
        }
    }

    while (true) {
        const status = await get();
        if (status == 200) {
            break;
        }
        console.log('.');
        await delay(interval);
    }
}
