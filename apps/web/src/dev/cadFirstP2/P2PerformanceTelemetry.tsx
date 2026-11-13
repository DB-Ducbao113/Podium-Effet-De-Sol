import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';

export type P2RenderMetrics = {
  fps: number;
  frameMs: number;
  calls: number;
  triangles: number;
  dpr: number;
};

/**
 * Read-only browser telemetry. Values are captured from the LIVE WebGL
 * renderer; never infer frame rates from offline CAD geometry or model size.
 * Updates at most once every ~1.2s while the cinematic is actually playing.
 */
export default function P2PerformanceTelemetry({
  playing,
  onMetrics,
  onContextLost,
}: {
  playing: boolean;
  onMetrics: (values:P2RenderMetrics)=>void;
  onContextLost: ()=>void;
}) {
  const { gl } = useThree();
  const timer = useRef(0);
  const frames = useRef(0);
  const callback = useRef(onMetrics);
  const context = useRef(onContextLost);
  useEffect(() => {
    callback.current = onMetrics;
    context.current = onContextLost;
  }, [onMetrics, onContextLost]);

  useEffect(() => {
    const canvas=gl.domElement;
    const lost = (event:Event) => {
      event.preventDefault();
      context.current();
    };
    canvas.addEventListener('webglcontextlost',lost,false);
    return () => canvas.removeEventListener('webglcontextlost',lost,false);
  },[gl]);

  useEffect(()=>{
    timer.current=0;
    frames.current=0;
  },[playing]);

  useFrame((state,delta)=>{
    if(!playing) return;
    timer.current += delta;
    frames.current++;
    if(timer.current < 1.2) return;
    const fps=frames.current/timer.current;
    callback.current({
      fps:Math.round(fps*10)/10,
      frameMs:Math.round((1000/fps)*10)/10,
      calls:state.gl.info.render.calls,
      triangles:state.gl.info.render.triangles,
      dpr:state.gl.getPixelRatio(),
    });
    timer.current=0;
    frames.current=0;
  });
  return null;
}
