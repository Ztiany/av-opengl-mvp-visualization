import React, { useState } from 'react';
import ControlPanel from './components/ControlPanel';
import ThreeScene from './components/ThreeScene';
import { AppState } from './types';

const INITIAL_STATE: AppState = {
  model: {
    meshType: 'cube',
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: 1,
  },
  view: {
    position: { x: 10, y: 10, z: 10 },
    target: { x: 0, y: 0, z: 0 },
    up: { x: 0, y: 1, z: 0 },
  },
  projection: {
    type: 'perspective',
    fov: 45,
    near: 1,
    far: 50,
    orthoSize: 5,
  },
};

export default function App() {
  const [appState, setAppState] = useState<AppState>(INITIAL_STATE);
  const [showHelp, setShowHelp] = useState(true);

  return (
    <div className="flex w-screen h-screen bg-slate-900 overflow-hidden font-sans">
      {/* Sidebar Controls */}
      <ControlPanel state={appState} onChange={setAppState} />

      {/* Main 3D Viewport Area */}
      <main className="flex-1 relative flex flex-col">
        <div className="flex-1 relative">
            <ThreeScene appState={appState} />

            {/* Help Toggle Button */}
            <button 
                onClick={() => setShowHelp(!showHelp)}
                className="absolute top-4 right-4 z-50 bg-gray-700 hover:bg-gray-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-lg transition-colors border border-gray-500"
                title="Toggle Help"
            >
                {showHelp ? '✕' : '?'}
            </button>

            {/* Help Overlay Panel */}
            {showHelp && (
                <div className="absolute top-14 right-4 z-40 w-80 pointer-events-none">
                    <div className="bg-slate-800/90 backdrop-blur text-white p-5 rounded-lg border border-gray-600 shadow-2xl pointer-events-auto">
                        <h2 className="font-bold text-lg text-blue-400 mb-3 border-b border-gray-600 pb-2">How to use</h2>
                        <ul className="list-disc list-outside ml-4 text-sm space-y-2 text-gray-300">
                            <li>
                                <strong className="text-white">Left Panel (World View):</strong> 
                                Use your mouse to rotate and zoom to see the scene from the outside ("God Mode").
                            </li>
                            <li>
                                <strong className="text-white">Right Panel (Camera View):</strong> 
                                Shows exactly what the virtual camera sees based on your settings.
                            </li>
                            <li>
                                <strong className="text-white">Sidebar:</strong> 
                                Adjust the Model, View, and Projection matrices to see how they affect the virtual camera's output (Right Panel) and its frustum shape (Left Panel).
                            </li>
                        </ul>
                        <div className="mt-4 text-xs text-gray-500 italic">
                            Tip: The yellow box in the Left Panel represents the camera's view volume (Frustum).
                        </div>
                    </div>
                </div>
            )}
        </div>
      </main>
    </div>
  );
}