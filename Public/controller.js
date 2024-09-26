async function datos(){
    try {
        const respuesta = await fetch('/api/usuarios');
        const datos = await respuesta.json();
        const tabla = document.querySelector('#query');
        tabla.innerHTML = '';
        datos.forEach(dato => {
            const fila = document.createElement('tr');
            fila.innerHTML = `
            <td> ${dato.id}</td>
            <td> ${dato.nombre}</td>
            <td> ${dato.correo}</td>
            <td> ${dato.password}</td>`
            tabla.appendChild(fila);
        });
        
    } catch (error) {
        console.log('No se obtuvo información')
    }
}

//cerrar sesion

const logoutButton = document.getElementById('logoutBtn');
    
logoutButton.addEventListener('click', () => {
    
    fetch('api/usuarios/logout', { method: 'GET' })
    .then(response => {
    if (response.ok) {
        
        window.location.href = '/login';
    } else {
        console.error('Error al cerrar sesión');
    }
    })
    .catch(error => {
    console.error('Error en la solicitud:', error);
    });
});

// Función para obtener los datos del usuario
function obtenerUsuario() {
    fetch('api/usuarios/usuario', {
        method: 'GET',
        credentials: 'include' 
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error al obtener los datos del usuario');
        }
        return response.json(); 
    })
    .then(data => {
       
        document.getElementById('nombreUsuario').value = data.nombre; 
    })
    .catch(error => {
        console.error('Error:', error);
    });
}


window.onload = obtenerUsuario;


