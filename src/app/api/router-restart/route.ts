import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { routerIp, username, password } = await request.json()

    // Validar que tenemos todos los datos necesarios
    if (!routerIp || !username || !password) {
      return NextResponse.json({
        success: false,
        error: 'Faltan datos requeridos (IP, usuario o contraseña)'
      }, { status: 400 })
    }

    // Paso 1: Intentar conectar al router
    console.log(`Conectando a http://${routerIp}`)
    
    let sessionCookies = ''
    
    try {
      // Primera petición: Obtener la página de login
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      
      const loginPageResponse = await fetch(`http://${routerIp}`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })
      
      clearTimeout(timeoutId)

      if (!loginPageResponse.ok) {
        throw new Error(`No se pudo conectar al router. Status: ${loginPageResponse.status}`)
      }

      // Extraer cookies de sesión si las hay
      const setCookieHeader = loginPageResponse.headers.get('set-cookie')
      if (setCookieHeader) {
        sessionCookies = setCookieHeader.split(',').map(cookie => cookie.split(';')[0]).join('; ')
      }

      console.log('Conexión exitosa al router')

    } catch (connectError) {
      return NextResponse.json({
        success: false,
        error: `No se pudo conectar al router en ${routerIp}. Verifica que esté encendido y que la IP sea correcta.`
      }, { status: 500 })
    }

    // Paso 2: Intentar autenticación
    console.log('Intentando autenticación...')
    
    try {
      // Intentar login con diferentes endpoints comunes
      const loginEndpoints = [
        '/login.cgi',
        '/cgi-bin/login.cgi', 
        '/goform/login',
        '/api/login',
        '/login'
      ]

      let loginSuccess = false
      
      for (const endpoint of loginEndpoints) {
        try {
          const loginData = new URLSearchParams({
            username: username,
            password: password,
            login: 'Login'
          })

          const loginController = new AbortController()
          const loginTimeoutId = setTimeout(() => loginController.abort(), 10000)
          
          const loginResponse = await fetch(`http://${routerIp}${endpoint}`, {
            method: 'POST',
            signal: loginController.signal,
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Cookie': sessionCookies,
              'Referer': `http://${routerIp}`
            },
            body: loginData.toString()
          })
          
          clearTimeout(loginTimeoutId)

          // Actualizar cookies si hay nuevas
          const newCookies = loginResponse.headers.get('set-cookie')
          if (newCookies) {
            sessionCookies += '; ' + newCookies.split(',').map(cookie => cookie.split(';')[0]).join('; ')
          }

          if (loginResponse.ok || loginResponse.status === 302) {
            console.log(`Login exitoso usando endpoint: ${endpoint}`)
            loginSuccess = true
            break
          }
        } catch (endpointError) {
          console.log(`Endpoint ${endpoint} no disponible, probando siguiente...`)
          continue
        }
      }

      if (!loginSuccess) {
        return NextResponse.json({
          success: false,
          error: 'No se pudo autenticar. Verifica las credenciales o que el router soporte login web.'
        }, { status: 401 })
      }

    } catch (authError) {
      return NextResponse.json({
        success: false,
        error: 'Error durante la autenticación. Verifica usuario y contraseña.'
      }, { status: 401 })
    }

    // Paso 3: Intentar reiniciar el router
    console.log('Intentando reiniciar el router...')
    
    try {
      // Endpoints comunes para reinicio
      const restartEndpoints = [
        '/goform/sysReboot',
        '/cgi-bin/restart.cgi',
        '/api/restart',
        '/restart.cgi',
        '/goform/restart',
        '/admin/restart.asp'
      ]

      let restartSuccess = false

      for (const endpoint of restartEndpoints) {
        try {
          const restartData = new URLSearchParams({
            restart: '1',
            reboot: 'Restart',
            action: 'restart'
          })

          const restartController = new AbortController()
          const restartTimeoutId = setTimeout(() => restartController.abort(), 15000)
          
          const restartResponse = await fetch(`http://${routerIp}${endpoint}`, {
            method: 'POST',
            signal: restartController.signal,
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Cookie': sessionCookies,
              'Referer': `http://${routerIp}`
            },
            body: restartData.toString()
          })
          
          clearTimeout(restartTimeoutId)

          // Para reinicio, tanto respuesta exitosa como timeout pueden ser válidos
          if (restartResponse.ok || restartResponse.status === 302) {
            console.log(`Comando de reinicio enviado exitosamente usando: ${endpoint}`)
            restartSuccess = true
            break
          }

        } catch (endpointError) {
          // Los timeouts son esperados durante reinicio
          if (endpointError instanceof Error && endpointError.message.includes('timeout')) {
            console.log(`Timeout esperado durante reinicio usando: ${endpoint}`)
            restartSuccess = true
            break
          }
          console.log(`Endpoint ${endpoint} no disponible, probando siguiente...`)
          continue
        }
      }

      if (!restartSuccess) {
        // Intentar con método GET en algunos endpoints
        for (const endpoint of restartEndpoints) {
          try {
            const getController = new AbortController()
            const getTimeoutId = setTimeout(() => getController.abort(), 10000)
            
            const restartResponse = await fetch(`http://${routerIp}${endpoint}`, {
              method: 'GET',
              signal: getController.signal,
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Cookie': sessionCookies
              }
            })
            
            clearTimeout(getTimeoutId)

            if (restartResponse.ok) {
              console.log(`Reinicio exitoso con GET: ${endpoint}`)
              restartSuccess = true
              break
            }
          } catch (getError) {
            continue
          }
        }
      }

      if (restartSuccess) {
        return NextResponse.json({
          success: true,
          message: 'Router reiniciado exitosamente. El dispositivo tardará unos minutos en volver a estar disponible.'
        })
      } else {
        return NextResponse.json({
          success: false,
          error: 'No se encontró el endpoint de reinicio para este modelo de router.'
        }, { status: 404 })
      }

    } catch (restartError) {
      return NextResponse.json({
        success: false,
        error: 'Error al enviar comando de reinicio al router.'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error general:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}