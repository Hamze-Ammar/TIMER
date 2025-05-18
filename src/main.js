import './style.css'
import Alpine from 'alpinejs'
import { timerApp } from './alpine.js'

Alpine.data("timerApp", timerApp);

window.Alpine = Alpine
window.Alpine.start()