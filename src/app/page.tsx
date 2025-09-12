'use client'

import { useState } from 'react'
import { RouterSimulator } from '@/components/RouterSimulator'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function HomePage() {
  const [isRestarting, setIsRestarting] = useState(false)

  const handleStartRestart = () => {
    setIsRestarting(true)
  }

  const handleRestartComplete = () => {
    setIsRestarting(false)
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Reiniciar Router
          </h1>
          <p className="text-lg text-gray-600 max-w-md mx-auto">
            Aplicación automática para reiniciar tu router LTE de forma rápida y sencilla
          </p>
        </div>

        {/* Main Card */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl text-gray-800">
              Estado del Router
            </CardTitle>
            <CardDescription className="text-gray-600">
              Presiona el botón para iniciar el proceso automático de reinicio
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!isRestarting ? (
              <div className="text-center space-y-4">
                <div className="p-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                    <div className="w-8 h-8 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                  <p className="text-lg text-gray-700 mb-6">
                    Router listo para reiniciar
                  </p>
                  <Button 
                    onClick={handleStartRestart}
                    className="w-full h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700 transform hover:scale-105 transition-all duration-200"
                  >
                    Reiniciar Router Automáticamente
                  </Button>
                </div>
                
                <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium mb-2">Proceso automático incluye:</p>
                  <ul className="text-left space-y-1 list-disc list-inside">
                    <li>Conexión a 192.168.192.1</li>
                    <li>Autenticación automática</li>
                    <li>Navegación a configuración</li>
                    <li>Reinicio del dispositivo</li>
                  </ul>
                </div>
              </div>
            ) : (
              <RouterSimulator onComplete={handleRestartComplete} />
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>Aplicación de reinicio automático para router LTE</p>
        </div>
      </div>
    </main>
  )
}