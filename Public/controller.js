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

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = '/login.html';
    } else {
        fetch('/api/usuarios/protegida', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (!response.ok) {
                window.location.href = '/login.html';
            }
        })
        .catch(error => {
            console.error('Error al verificar el token', error);
            window.location.href = '/login.html';
        });
    }
});

