const { createApp } = Vue;

//Componente: Formulario de Planta//
const FormularioPlanta = {
  name: 'formulario-planta',
  template: `
    <form @submit.prevent="enviarFormulario" class="plant-form" novalidate>
      <h3>Agregar Planta</h3>

      <label>Nombre 
        <input v-model="formulario.nombre" placeholder="Ej: Sansevieria" />
      </label>
      <div v-if="errores.nombre" class="error">{{ errores.nombre }}</div>

      <label>Tipo
        <select v-model="formulario.tipo">
          <option disabled value="">-- Elige un tipo --</option>
          <option>Interior</option>
          <option>Exterior</option>
          <option>Suculenta</option>
          <option>Ornamental</option>
        </select>
      </label>
      <div v-if="errores.tipo" class="error">{{ errores.tipo }}</div>

      <label>Dificultad de cuidado
        <select v-model="formulario.dificultad">
          <option disabled value="">-- Selecciona --</option>
          <option>Fácil</option>
          <option>Medio</option>
          <option>Difícil</option>
        </select>
      </label>
      <div v-if="errores.dificultad" class="error">{{ errores.dificultad }}</div>

      <label>Imagen
        <input type="file" accept="image/*" @change="cargarImagen" />
      </label>
      <div v-if="formulario.imagen">
        <small>Vista previa:</small><br>
        <img :src="formulario.imagen" alt="Vista previa" style="max-width:120px; margin-top:5px;">
      </div>

      <label>Último riego
        <input type="date" v-model="formulario.ultimoRiego" />
      </label>

      <label>Notas
        <textarea v-model="formulario.notas" rows="3" placeholder="Observaciones"></textarea>
      </label>

      <div class="form-actions">
        <button type="submit">Agregar planta</button>
      </div>
    </form>
  `,
  data() {
    return {
      formulario: {
        id: null,
        nombre: '',
        tipo: '',
        dificultad: '',
        diasRiego: null,
        imagen: '',
        notas: '',
        fechaAgregada: null,
        favorito: false,
        ultimoRiego: '' 
      },
      errores: {}
    }
  },
  methods: {
    validar() {
      this.errores = {};
      if (!this.formulario.nombre || this.formulario.nombre.trim().length < 2) {
        this.errores.nombre = 'El nombre debe tener al menos 2 caracteres.';
      }
      if (!this.formulario.tipo) {
        this.errores.tipo = 'Selecciona un tipo de planta.';
      }
      if (!this.formulario.dificultad) {
        this.errores.dificultad = 'Selecciona un nivel de dificultad.';
      }
      return Object.keys(this.errores).length === 0;
    },
    cargarImagen(e) {
      const archivo = e.target.files[0];
      if (!archivo) return;
      const lector = new FileReader();
      lector.onload = (ev) => {
        this.formulario.imagen = ev.target.result; 
      };
      lector.readAsDataURL(archivo);
    },
    enviarFormulario() {
      if (!this.validar()) return;
      const datos = Object.assign({}, this.formulario);
      datos.id = 'p-' + Date.now();
      datos.fechaAgregada = new Date().toISOString();
      this.$emit('guardar-planta', datos);
      this.reiniciarFormulario();
    },
    reiniciarFormulario() {
      this.formulario = {
        id: null,
        nombre: '',
        tipo: '',
        dificultad: '',
        diasRiego: null,
        imagen: '',
        notas: '',
        fechaAgregada: null,
        favorito: false,
        ultimoRiego: ''
      };
      this.errores = {};
    }
  }
};

// Componente: Tarjeta de Planta
const TarjetaPlanta = {
  name: 'tarjeta-planta',
  props: ['planta'],
  template: `
    <article class="card" :class="planta.favorito ? 'favorite' : ''">
      <div class="media">
        <img :src="imagenOPorDefecto(planta.imagen)" :alt="planta.nombre" />
      </div>
      <div class="body">
        <h4>{{ aMayusculas(planta.nombre) }}</h4>

        <p class="meta">
          <span>Tipo: <strong>{{ planta.tipo }}</strong></span>
          <span>Dificultad: 
            <strong :class="claseDificultad(planta.dificultad)">
              {{ planta.dificultad }}
            </strong>
          </span>
        </p>

        <p class="notes">{{ acortar(planta.notas) }}</p>

        <p class="care">
          <strong>Cuidados:</strong> {{ planta.consejosCuidado }}  
          <br>💧 Se riega cada <strong>{{ planta.diasRiego }}</strong> días.
        </p>

        <p class="status">
          <span v-if="necesitaRiego(planta) === 'urgente'">Necesita riego ahora</span>
          <span v-else-if="necesitaRiego(planta) === 'pronto'">Regar pronto</span>
          <span v-else>Riego OK</span>
        </p>

        <p class="added">Agregada: {{ formatearFecha(planta.fechaAgregada) }}</p>

        <div class="actions">
          <button @click="$emit('eliminar-planta', planta)">Eliminar</button>
          <button @click="alternarFavorito">{{ planta.favorito ? 'Quitar favorito' : 'Marcar favorito' }}</button>
        </div>
      </div>
    </article>
  `,
  methods: {
    imagenOPorDefecto(url) {
      return url && url.trim().length > 0 ? url : 'img/placeholder.jpg';
    },
    aMayusculas(texto) {
      return texto ? texto.toUpperCase() : '';
    },
    acortar(texto, n = 80) {
      if (!texto) return '';
      return texto.length > n ? texto.slice(0,n) + '…' : texto;
    },
    formatearFecha(iso) {
      if (!iso) return '—';
      const d = new Date(iso);
      return d.getDate().toString().padStart(2,'0') + '/' + (d.getMonth()+1).toString().padStart(2,'0') + '/' + d.getFullYear();
    },
    necesitaRiego(planta) {
      if (!planta || !planta.diasRiego) return 'ok';
      const diasRestantes = this.diasParaProximoRiego(planta);
      if (diasRestantes <= 0) return 'urgente';
      if (diasRestantes <= 3) return 'pronto';
      return 'ok';
    },
    diasParaProximoRiego(planta) {
      if (!planta.ultimoRiego || !planta.diasRiego) return '—';
      const ultima = new Date(planta.ultimoRiego);
      const proxima = new Date(ultima);
      proxima.setDate(ultima.getDate() + planta.diasRiego);
      const hoy = new Date();
      const diferencia = Math.ceil((proxima - hoy) / (1000*60*60*24));
      return diferencia >= 0 ? diferencia : 0;
    },
    alternarFavorito() {
      this.$emit('alternar-favorito', this.planta);
    },
    claseDificultad(nivel) {
      return {
        'dif-facil': nivel === 'Fácil',
        'dif-medio': nivel === 'Medio',
        'dif-dificil': nivel === 'Difícil'
      };
    }
  }
};

// Aplicación principal
createApp({
  components: { 
    'formulario-planta': FormularioPlanta, 
    'tarjeta-planta': TarjetaPlanta 
  },
  data() {
    return {
      plantas: []
    }
  },
  created() {
    this.cargarDesdeLocal();
  },
  methods: {
    agregarPlanta(datos) {
      datos.diasRiego = this.obtenerDiasRiego(datos.tipo);
      datos.consejosCuidado = this.obtenerConsejos(datos);
      this.plantas.unshift(datos);
      this.guardarEnLocal();
    },
    eliminarPlanta(item) {
      if (!confirm('¿Eliminar planta "' + (item.nombre || 'sin nombre') + '"?')) return;
      this.plantas = this.plantas.filter(p => p.id !== item.id);
      this.guardarEnLocal();
    },
    alternarFavorito(item) {
      const idx = this.plantas.findIndex(p => p.id === item.id);
      if (idx === -1) return;
      this.plantas[idx].favorito = !this.plantas[idx].favorito;
      this.guardarEnLocal();
    },
    guardarEnLocal() {
      localStorage.setItem('plantas', JSON.stringify(this.plantas));
    },
    cargarDesdeLocal() {
      const datos = localStorage.getItem('plantas');
      this.plantas = datos ? JSON.parse(datos) : [];
    },
    obtenerDiasRiego(tipo) {
      switch(tipo) {
        case 'Interior': return 5;
        case 'Exterior': return 3;
        case 'Suculenta': return 14;
        case 'Ornamental': return 7;
        default: return 7;
      }
    },
    obtenerConsejos(planta) {
      const nombre = planta.nombre.toLowerCase();
      if (nombre.includes('sansevieria')) return 'Riego cada 2-3 semanas, poca luz, muy resistente.';
      if (nombre.includes('cactus')) return 'Mucho sol, riego muy escaso, evitar exceso de agua.';
      if (nombre.includes('rosa')) return 'Sol directo, riego frecuente, podar flores secas.';
      if (nombre.includes('helecho')) return 'Ambiente húmedo, sombra parcial, riego regular.';
      switch(planta.tipo) {
        case 'Interior': return 'Prefiere luz indirecta, riego moderado.';
        case 'Exterior': return 'Tolera más sol, riego frecuente.';
        case 'Suculenta': return 'Mucho sol, poco riego, tierra bien drenada.';
        case 'Ornamental': return 'Riego cada semana y buena iluminación.';
      }
      return 'Riego moderado y luz indirecta recomendada.';
    }
  }
}).mount('#app');
