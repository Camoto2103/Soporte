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
    // Escuchar el click en el botón
logoutButton.addEventListener('click', () => {
    // Realizar la petición al servidor para cerrar sesión
    fetch('api/usuarios/logout', { method: 'GET' })
    .then(response => {
    if (response.ok) {
        // Redirigir al usuario a la página de inicio o login
        window.location.href = '/login';
    } else {
        console.error('Error al cerrar sesión');
    }
    })
    .catch(error => {
    console.error('Error en la solicitud:', error);
    });
});



