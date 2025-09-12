'use client'

import { useState } from 'react'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'

type SimulationStep = {
  id: string
  title: string
  description: string
  duration: number
  status: 'pending' | 'running' | 'completed' | 'error'
}

interface RouterSimulatorProps {
  onComplete: () => void
}

export function RouterSimulator({ onComplete }: RouterSimulatorProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(-1)
  const [progress, setProgress] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)

  const steps: SimulationStep[] = [
    {
      id: 'connect',
      title: 'Conectando al router',
      description: 'Accediendo a 192.168.192.1...',
      duration: 0,
      status: 'pending'
    },
    {
      id: 'login',
      title: 'Iniciando sesión',
      description: 'Autenticando con credenciales (user / LTE@Endusr)...',
      duration: 0,
      status: 'pending'
    },
    {
      id: 'navigate',
      title: 'Navegando a configuración',
      description: 'Accediendo a Ajustes > Sistema > Reiniciar...',
      duration: 0,
      status: 'pending'
    },
    {
      id: 'restart',
      title: 'Reiniciando router',
      description: 'Enviando comando de reinicio...',
      duration: 0,
      status: 'pending'
    },
    {
      id: 'complete',
      title: 'Proceso completado',
      description: 'Router reiniciado exitosamente',
      duration: 0,
      status: 'pending'
    }
  ]

  const [routerSteps, setRouterSteps] = useState(steps)

  const executeRouterRestart = async () => {
    if (isRunning) return
    
    setIsRunning(true)
    setError(null)
    setCurrentStepIndex(0)
    setProgress(0)

    try {
      // Paso 1: Conectar al router
      updateStepStatus(0, 'running')
      setProgress(20)
      
      const response = await fetch('/api/router-restart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'restart',
          routerIp: '192.168.192.1',
          username: 'user',
          password: 'LTE@Endusr'
        })
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success) {
        // Completar todos los pasos
        for (let i = 0; i < steps.length; i++) {
          updateStepStatus(i, i === steps.length - 1 ? 'completed' : 'completed')
          setCurrentStepIndex(i)
          setProgress(((i + 1) / steps.length) * 100)
          
          // Pequeño delay visual entre pasos
          if (i < steps.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 800))
          }
        }
        
        setIsComplete(true)
      } else {
        throw new Error(result.error || 'Error desconocido')
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión al router')
      updateStepStatus(currentStepIndex, 'error')
    } finally {
      setIsRunning(false)
    }
  }

  const updateStepStatus = (stepIndex: number, status: SimulationStep['status']) => {
    setRouterSteps(prev => prev.map((step, index) => ({
      ...step,
      status: index === stepIndex ? status : 
              index < stepIndex ? 'completed' : 'pending'
    })))
  }

  const startProcess = () => {
    executeRouterRestart()
  }

  const getStepIcon = (step: SimulationStep) => {
    switch (step.status) {
      case 'completed':
        return (
          <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">✓</span>
          </div>
        )
      case 'running':
        return (
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        )
      default:
        return <div className="w-5 h-5 rounded-full bg-gray-300" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Progreso</span>
          <span className="text-gray-900 font-semibold">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-3" />
      </div>

      {/* Steps List */}
      <div className="space-y-3">
        {routerSteps.map((step, index) => (
          <div 
            key={step.id}
            className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 ${
              step.status === 'running' 
                ? 'bg-blue-50 border border-blue-200' 
                : step.status === 'completed'
                ? 'bg-green-50 border border-green-200'
                : 'bg-gray-50'
            }`}
          >
            <div className="flex-shrink-0">
              {getStepIcon(step)}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${
                step.status === 'running' ? 'text-blue-900' :
                step.status === 'completed' ? 'text-green-900' :
                'text-gray-700'
              }`}>
                {step.title}
              </p>
              <p className={`text-sm ${
                step.status === 'running' ? 'text-blue-600' :
                step.status === 'completed' ? 'text-green-600' :
                'text-gray-500'
              }`}>
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">!</span>
            </div>
            <div>
              <p className="text-sm font-medium text-red-900">Error en el proceso</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
          <Button 
            onClick={() => {
              setError(null)
              setCurrentStepIndex(-1)
              setProgress(0)
              setRouterSteps(steps)
            }}
            className="mt-3 w-full bg-red-600 hover:bg-red-700"
          >
            Reintentar
          </Button>
        </div>
      )}

      {/* Start Button */}
      {currentStepIndex === -1 && !error && (
        <div className="text-center">
          <Button 
            onClick={startProcess}
            disabled={isRunning}
            className="w-full h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700"
          >
            {isRunning ? 'Procesando...' : 'Iniciar Reinicio del Router'}
          </Button>
          <p className="text-sm text-gray-500 mt-2">
            Esto se conectará realmente a tu router en 192.168.192.1
          </p>
        </div>
      )}

      {/* Completion Actions */}
      {isComplete && (
        <div className="text-center pt-4 space-y-4">
          <div className="p-6 bg-green-50 rounded-lg border border-green-200">
            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white text-2xl font-bold">✓</span>
            </div>
            <h3 className="text-lg font-semibold text-green-900 mb-2">
              ¡Router reiniciado exitosamente!
            </h3>
            <p className="text-green-700">
              El proceso de reinicio se ha completado. El router debería estar funcionando normalmente en unos momentos.
            </p>
          </div>
          
          <Button 
            onClick={onComplete}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            Finalizar
          </Button>
        </div>
      )}
    </div>
  )
}