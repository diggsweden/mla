import { getCameraStateToFitViewportToNodes } from '@sigma/utils';
import Sigma from 'sigma';

export type FitToNodesOptions = {
    animate: boolean;
    zoomRatio: number;
    timeout?: number;
};
export const DEFAULT_FIT_TO_NODES_OPTIONS: FitToNodesOptions = {
    animate: true,
    zoomRatio: 0.4,
    timeout: undefined
};

export async function fitNodesInView(sigma: Sigma, nodes: string[], opts: Partial<FitToNodesOptions> = {}): Promise<void> {
    if (nodes.length == 0) {
        return;
    }

    const { animate, timeout, zoomRatio } = {
        ...DEFAULT_FIT_TO_NODES_OPTIONS,
        ...opts,
    };

    const fit = async () => {
        const camera = sigma.getCamera();
        const newCameraState = getCameraStateToFitViewportToNodes(sigma, nodes, opts);
        newCameraState.ratio += newCameraState.ratio * zoomRatio;

        if (animate) {
            await camera.animate(newCameraState);
        } else {
            camera.setState(newCameraState);
        }

        camera.setState(newCameraState);
    }

    if (timeout) {
        window.setTimeout(() => {
            fit()
        }, timeout)
    } else {
        fit()
    }
}

