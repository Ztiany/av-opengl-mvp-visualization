import React from 'react';
import { AppState, Vector3, ProjectionType } from '../types';

interface ControlPanelProps {
  state: AppState;
  onChange: (newState: AppState) => void;
}

// --- Helper Components ---

const HelpIcon = ({ text }: { text: string }) => (
  <div className="group relative inline-flex ml-1.5 items-center justify-center">
    <div className="cursor-help text-gray-500 hover:text-blue-400 transition-colors">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    </div>
    {/* Tooltip Popup */}
    {/* Fixed: Anchored to the left (-12px) instead of center to prevent clipping off-screen */}
    <div className="absolute bottom-full left-[-12px] mb-2 w-48 p-2 bg-slate-900 text-gray-300 text-[10px] leading-relaxed rounded border border-gray-600 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
      {text}
      {/* Arrow: Aligned to point to the icon (approx 19px from left edge of tooltip) */}
      <div className="absolute top-full left-[19px] -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
    </div>
  </div>
);

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (val: number) => void;
  unit?: string;
  description?: string;
}

const Slider: React.FC<SliderProps> = ({ label, value, min, max, step, onChange, unit = '', description }) => {
  return (
    <div className="mb-3 bg-slate-800/30 p-2 rounded border border-gray-700/50 hover:border-gray-600 transition-colors relative">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center">
          <label className="text-xs text-gray-300 font-medium select-none">{label}</label>
          {description && <HelpIcon text={description} />}
        </div>
        <div className="flex items-center">
          <input
            type="number"
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) onChange(val);
            }}
            className="w-16 bg-slate-900 text-right text-xs text-blue-300 border border-gray-600 rounded px-1 py-1 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
          />
          {unit && <span className="text-xs text-gray-500 ml-1 w-3 select-none">{unit}</span>}
        </div>
      </div>
      <div className="h-6 flex items-center">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full block"
        />
      </div>
    </div>
  );
};

const Section = ({ title, children, description }: any) => (
  <div className="mb-6 border-b border-gray-700 pb-4">
    <h3 className="text-sm font-bold text-white mb-1 uppercase tracking-wider select-none">{title}</h3>
    <p className="text-xs text-gray-400 mb-4 italic select-none">{description}</p>
    {children}
  </div>
);

// --- Main Component ---

const ControlPanel: React.FC<ControlPanelProps> = ({ state, onChange }) => {
  const updateModel = (key: keyof AppState['model'], value: any) => {
    onChange({ ...state, model: { ...state.model, [key]: value } });
  };

  const updateModelVec = (key: 'position' | 'rotation', axis: keyof Vector3, val: number) => {
    updateModel(key, { ...state.model[key], [axis]: val });
  };

  const updateView = (key: keyof AppState['view'], value: any) => {
    onChange({ ...state, view: { ...state.view, [key]: value } });
  };

  const updateViewVec = (key: 'position' | 'target' | 'up', axis: keyof Vector3, val: number) => {
    updateView(key, { ...state.view[key], [axis]: val });
  };

  const updateProj = (key: keyof AppState['projection'], value: any) => {
    onChange({ ...state, projection: { ...state.projection, [key]: value } });
  };

  return (
    <div className="w-80 bg-slate-900 border-r border-gray-700 h-full overflow-y-auto p-4 flex flex-col shadow-xl z-30 shrink-0">
      <h1 className="text-xl font-bold text-blue-400 mb-6 flex items-center select-none">
        <span>MVP Visualizer</span>
      </h1>

      {/* MODEL MATRIX */}
      <Section 
        title="1. Model Matrix" 
        description="Transforms the object from Local Space to World Space."
      >
        <div className="space-y-2">
          <div className="mb-4">
            <div className="flex items-center mb-2">
               <span className="text-xs font-semibold text-blue-300 block select-none">Geometry</span>
               <HelpIcon text="Select the 3D mesh geometry to be transformed." />
            </div>
            <select
              value={state.model.meshType}
              onChange={(e) => updateModel('meshType', e.target.value)}
              className="w-full bg-slate-800 text-white text-xs rounded p-2 border border-gray-600 focus:outline-none focus:border-blue-500 cursor-pointer hover:bg-gray-750"
            >
              <option value="cube">Cube (Colored Faces)</option>
              <option value="sphere">Sphere (PBR Material)</option>
              <option value="torusKnot">Torus Knot</option>
              <option value="icosahedron">Icosahedron</option>
            </select>
          </div>

          <div>
            <span className="text-xs font-semibold text-blue-300 block mb-2 select-none">Translation (Position)</span>
            <Slider label="X" value={state.model.position.x} min={-10} max={10} step={0.1} onChange={(v: number) => updateModelVec('position', 'x', v)} description="Moves the object along the World X axis (Left/Right)." />
            <Slider label="Y" value={state.model.position.y} min={-10} max={10} step={0.1} onChange={(v: number) => updateModelVec('position', 'y', v)} description="Moves the object along the World Y axis (Up/Down)." />
            <Slider label="Z" value={state.model.position.z} min={-10} max={10} step={0.1} onChange={(v: number) => updateModelVec('position', 'z', v)} description="Moves the object along the World Z axis (Forward/Backward)." />
          </div>
          <div>
            <span className="text-xs font-semibold text-green-300 block mb-2 select-none">Rotation</span>
            <Slider label="X" value={state.model.rotation.x} min={0} max={360} step={1} onChange={(v: number) => updateModelVec('rotation', 'x', v)} unit="°" description="Rotates the object around the X axis (Pitch)." />
            <Slider label="Y" value={state.model.rotation.y} min={0} max={360} step={1} onChange={(v: number) => updateModelVec('rotation', 'y', v)} unit="°" description="Rotates the object around the Y axis (Yaw)." />
            <Slider label="Z" value={state.model.rotation.z} min={0} max={360} step={1} onChange={(v: number) => updateModelVec('rotation', 'z', v)} unit="°" description="Rotates the object around the Z axis (Roll)." />
          </div>
          <div>
            <span className="text-xs font-semibold text-purple-300 block mb-2 select-none">Scale</span>
            <Slider label="Uniform" value={state.model.scale} min={0.1} max={5} step={0.1} onChange={(v: number) => updateModel('scale', v)} description="Resizes the object uniformly in all directions. 1.0 is original size." />
          </div>
        </div>
      </Section>

      {/* VIEW MATRIX */}
      <Section 
        title="2. View Matrix" 
        description="Transforms World Space to Camera Space. Defined by Eye, Target, and Up."
      >
        <div className="space-y-2">
          <div>
            <span className="text-xs font-semibold text-yellow-300 block mb-2 select-none">Eye Position (Camera)</span>
            <Slider label="X" value={state.view.position.x} min={-20} max={20} step={0.5} onChange={(v: number) => updateViewVec('position', 'x', v)} description="The X coordinate of the camera's position in the world." />
            <Slider label="Y" value={state.view.position.y} min={-20} max={20} step={0.5} onChange={(v: number) => updateViewVec('position', 'y', v)} description="The Y coordinate of the camera's position in the world." />
            <Slider label="Z" value={state.view.position.z} min={-20} max={20} step={0.5} onChange={(v: number) => updateViewVec('position', 'z', v)} description="The Z coordinate of the camera's position in the world." />
          </div>
          <div>
            <span className="text-xs font-semibold text-red-300 block mb-2 select-none">Target (Look At)</span>
            <Slider label="X" value={state.view.target.x} min={-10} max={10} step={0.5} onChange={(v: number) => updateViewVec('target', 'x', v)} description="The X coordinate of the point the camera is looking at." />
            <Slider label="Y" value={state.view.target.y} min={-10} max={10} step={0.5} onChange={(v: number) => updateViewVec('target', 'y', v)} description="The Y coordinate of the point the camera is looking at." />
            <Slider label="Z" value={state.view.target.z} min={-10} max={10} step={0.5} onChange={(v: number) => updateViewVec('target', 'z', v)} description="The Z coordinate of the point the camera is looking at." />
          </div>
        </div>
      </Section>

      {/* PROJECTION MATRIX */}
      <Section 
        title="3. Projection Matrix" 
        description="Transforms Camera Space to Clip Space. Determines the lens properties."
      >
        <div className="flex bg-gray-800 rounded p-1 mb-6 relative">
          <div className="absolute -top-6 right-0">
             <HelpIcon text="Perspective: Mimics human eye (depth). Orthographic: Parallel projection (no depth distortion, engineering view)." />
          </div>
          <button 
            className={`flex-1 text-xs py-2 rounded font-medium transition-colors ${state.projection.type === 'perspective' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
            onClick={() => updateProj('type', 'perspective')}
          >
            Perspective
          </button>
          <button 
            className={`flex-1 text-xs py-2 rounded font-medium transition-colors ${state.projection.type === 'orthographic' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
            onClick={() => updateProj('type', 'orthographic')}
          >
            Orthographic
          </button>
        </div>

        {state.projection.type === 'perspective' ? (
          <div>
             <Slider label="FOV" value={state.projection.fov} min={10} max={120} step={1} onChange={(v: number) => updateProj('fov', v)} unit="°" description="Field of View (Vertical). Wider angle = 'Fish Eye' effect (Zoom out)." />
             <Slider label="Near Plane" value={state.projection.near} min={0.1} max={10} step={0.1} onChange={(v: number) => updateProj('near', v)} description="Objects closer than this distance are not rendered (clipped)." />
             <Slider label="Far Plane" value={state.projection.far} min={10} max={100} step={1} onChange={(v: number) => updateProj('far', v)} description="Objects further than this distance are not rendered (clipped)." />
          </div>
        ) : (
          <div>
             <Slider label="Size (Zoom)" value={state.projection.orthoSize} min={2} max={20} step={0.5} onChange={(v: number) => updateProj('orthoSize', v)} description="The vertical size of the viewing volume. Smaller value = Zoom In." />
             <Slider label="Near Plane" value={state.projection.near} min={0.1} max={10} step={0.1} onChange={(v: number) => updateProj('near', v)} description="Objects closer than this distance are not rendered." />
             <Slider label="Far Plane" value={state.projection.far} min={10} max={100} step={1} onChange={(v: number) => updateProj('far', v)} description="Objects further than this distance are not rendered." />
          </div>
        )}
      </Section>

      <div className="mt-auto pt-4 text-xs text-gray-600 border-t border-gray-800 select-none">
        <p>Interactive 3D Education</p>
      </div>
    </div>
  );
};

export default ControlPanel;