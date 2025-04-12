function timerApp() {
  return {
    showAddTimer: false,
    requestResume: false,
    timers: [],
    logs: [],
    newTimer: {
      id: null,
      name: '',
      duration: '',
      durationInitial: '',
      unit: '',
      color: 'gray',
      classes: '',
      sound: 'beep',
      interval: null,
      timeLeft: 0,
      endsAtFormatted: null,
      endsAt: null, // timestamp
      isPaused: false,
      isPlaying: false,
      isPlayingSound: false,
      showLogs: false,
    },
    init: function() {
      this.timers = JSON.parse(localStorage.getItem('timers')) || [];
      this.logs = JSON.parse(localStorage.getItem('timersLogs')) || [];

      // play sound if timer is playing
      this.timers.forEach((timer, index) => {
        
        if (timer.isPlayingSound) {
          // this.hardResetTimer(timer);
        }
        // if timer is paused, set timeLeft to duration
        if (timer.isPlaying || timer.isPlayingSound) {
          timer.interval = null;

          // get timeLeft from endsAt
          if (timer.endsAt) {
            const timeLeft = Math.floor((timer.endsAt - Date.now()) / 1000);
            timer.timeLeft = timeLeft;
            timer.endsAtFormatted = this.getFormattedEndsAt(timer);
          } else {
            timer.timeLeft = timer.duration;
          }
          this.$nextTick(() => {
            this.startTimer(timer);
          });

          this.requestResume = true;
        }

      });
      

      this.$watch('timers', (newValue) => {
        this.save();
      });
      this.$watch('logs', (newValue) => {
        this.saveLogs();
      });
    },
    getTimerLogs(timer) {
      const timerId = timer.id;
      return this.logs
        .filter(log => log.timerId === timerId)
        .sort((a, b) => b.timestamp - a.timestamp);
    },
    save() {
      localStorage.setItem('timers', JSON.stringify(this.timers));
    },

    closeResumeModal() {
      this.requestResume = false;
    },

    isNegative(seconds) {
      if (seconds === null || seconds === undefined) {
        return false;
      }
      return seconds < 0;
    },

    formatTime(seconds) {
      if (seconds === null || seconds === undefined) {
        return '';
      }
      if (seconds < 0) {
        seconds = Math.abs(seconds);
        return `-${this.formatTime(seconds)}`;
      }
      
      const hrs = Math.floor(seconds / 3600).toString().padStart(2, '0');
      const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
      const secs = (seconds % 60).toString().padStart(2, '0');
      return `${hrs}:${mins}:${secs}`;
    },

    addTimer() {
      if (!this.newTimer.name) {
        this.newTimer.name = 'TIMER NAME';
      };
      if (!this.newTimer.duration) {
        this.newTimer.duration = 4;
      };
      if (!this.newTimer.unit) {
        this.newTimer.unit = 'seconds';
      };
      if (!this.newTimer.durationInitial) {
        this.newTimer.durationInitial = this.newTimer.duration;
      };

      if (this.newTimer.unit === 'minutes') {
        this.newTimer.duration *= 60;
      } else if (this.newTimer.unit === 'hours') {
        this.newTimer.duration *= 3600;
      }
      if (this.newTimer.unit === 'seconds') {
        this.newTimer.duration *= 1;
      } else if (this.newTimer.unit === 'days') {
        this.newTimer.duration *= 86400;
      }
      if (this.newTimer.unit === 'weeks') {
        this.newTimer.duration *= 604800;
      } else if (this.newTimer.unit === 'months') {
        this.newTimer.duration *= 2592000;
      }
      if (this.newTimer.unit === 'years') {
        this.newTimer.duration *= 31536000;
      }
      // validate duration
      if (this.newTimer.duration <= 0) {
        alert('Please enter a valid duration');
        return;
      }

      const classes = `bg-${this.newTimer.color}-500 text-white font-bold rounded`;

      const timer = {
        id: Math.random().toString(36).substr(2, 9),
        name: this.newTimer.name,
        timeLeft: parseInt(this.newTimer.duration),
        duration: parseInt(this.newTimer.duration),
        color: this.newTimer.color,
        classes: classes,
        sound: this.newTimer.sound,
        durationInitial: this.newTimer.durationInitial,
        unit: this.newTimer.unit,
        isPaused: false,
        isPlaying: false,
        isPlayingSound: false,
        interval: null
      }
      this.timers.push(timer);

      this.newTimer.name = '';
      this.newTimer.duration = '';
      this.newTimer.durationInitial = '';

      this.showAddTimer = false;
      this.log(timer, 'add');
    },

    formatDateHTML(timestamp) {
      const date = new Date(timestamp);
    
      const month = date.toLocaleString('en-US', { month: 'short' }); // e.g., "Apr"
      const day = date.getDate().toString().padStart(2, '0');         // e.g., "10"
      const time = date.toLocaleTimeString('en-US', { hour12: false }); // e.g., "14:30:59"
    
      return `<span class="date-part">${month} ${day}</span><span>, </span><span class="time-part">${time}</span>`;
    },    

    stopAlarm(timer) {
      if (timer.isPlayingSound) {
        this.stopSound(timer);
      }
      this.hardResetTimer(timer);
    },

    singularizeUnit(timer) {
      if (timer.durationInitial.toString() === "1") {
        return timer.unit.slice(0, -1);
      }
      return timer.unit;
    },

    startTimer(timer) {
      if (timer.interval) {
        return;
      } else {

        if (timer.isPaused) {
          this.log(timer, 'resume');
        } else {
          this.log(timer, 'start');
        }

        timer.isPlaying = true;
        timer.isPaused = false;
        timer.isPlayingSound = false;
        timer.endsAt = Date.now() + ( timer.timeLeft * 1000 );
        timer.endsAtFormatted = this.getFormattedEndsAt(timer);

      }

      const timerEl = document.querySelector(`[data-id='${timer.id}']`);
      if(!timerEl) {
        console.error('Timer element not found');
        return;
      }

      const circle = timerEl.querySelector(".progress-ring__circle");
      const radius = circle.r.baseVal.value;
      
      const circumference = 2 * Math.PI * radius;
      circle.style.strokeDasharray = `${circumference}`;
      circle.style.strokeDashoffset = `${circumference}`;

      function setProgress(percent) {
        const offset = circumference - (percent / 100) * circumference;
        
        circle.style.strokeDashoffset = circumference - offset;
      }
      setProgress((timer.timeLeft / timer.duration) * 100);


      timer.interval = setInterval(() => {
        timer.timeLeft--;
        if (timer.timeLeft >= 0) {

          setProgress((timer.timeLeft / timer.duration) * 100);
          
        } else if( !timer.isPlayingSound) {
          timer.isPlaying = false;
          timer.isPlayingSound = true;
          this.playSound(timer);
        }

        if( timer.timeLeft < 0 && !timer.isNegative) {
          timer.isNegative = true;
        }
      }, 1000);

    },

    hardResetTimer(timer) {

      if( timer.isPlayingSound) {
        this.log(timer, 'alarmOff');
      } else {
        this.log(timer, 'stop');
      }

      if (timer.interval) {
        clearInterval(timer.interval);
        timer.interval = null;
        timer.isPlaying = false;
      }
      timer.isPaused = false;
      timer.timeLeft = parseInt(timer.duration);
      timer.endsAt = null;
      timer.endsAtFormatted = null;
      timer.isPlayingSound = false;
      timer.isNegative = false;
    },

    getFormattedEndsAt(timer) {
      const endDate = new Date(Date.now() + timer.timeLeft * 1000);
    
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
      const month = months[endDate.getMonth()];
      const day = endDate.getDate();
      const hours = String(endDate.getHours()).padStart(2, '0');
      const minutes = String(endDate.getMinutes()).padStart(2, '0');
      const seconds = String(endDate.getSeconds()).padStart(2, '0');
    
      return `${month} ${day}, ${hours}:${minutes}:${seconds}`;
    },

    pauseTimer(index) {
      const timer = this.timers[index];
      if (timer.interval) {
        clearInterval(timer.interval);
        timer.interval = null;
        timer.isPlaying = false;
        timer.isPaused = true;

        this.log(timer, 'pause');
      }
    },

    playSound(timer) {
      const sound = timer.sound
      const original = document.getElementById(sound.split('.')[0]);

      if (timer.audio) {
        const checkAudioEl = document.getElementById(timer.audio);
        if (checkAudioEl) {
          checkAudioEl.remove();
        }
      }
        
      const clone = original.cloneNode(true);

      // Set the id to the timer id
      const id = `${sound.split('.')[0]}-${timer.id}`;
      clone.id = id;
      timer.audio = id;
      clone.dataset.id = timer.id;

      clone.dataset.loop = "true";
      clone.loop = true;
      clone.play();
      document.body.appendChild(clone);
    },

    stopSound(timer) {
      const sound = timer.sound
      const audioId = `${sound.split('.')[0]}-${timer.id}`;
      const audio = document.getElementById(audioId);

      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        audio.loop = false;
        audio.dataset.loop = "false";
        audio.remove();
      }
    },

    removeTimer(index) {
      if(confirm('Are you sure you want to delete this timer?')) {
        const timer = this.timers[index];
        this.clearTimerLogs(timer.id);
        if (timer.interval) {
          clearInterval(timer.interval);
          timer.interval = null;
        }
        if (timer.isPlayingSound) {
          this.stopSound(timer);
          timer.isPlayingSound = false;
        }
        this.timers.splice(index, 1);
        localStorage.setItem('timers', JSON.stringify(this.timers));
        if (this.timers.length === 0) {
          localStorage.removeItem('timers');
        }

      } 
    },

    log(timer, action) {
      const timestamp = Date.now();
      let msg = '';
      switch (action) {
        case 'add':
          msg = `Created`;
          break;
        case 'start':
          msg = `Played`;
          break;
        case 'pause':
          msg = `Paused`;
          break;
        case 'resume':
          msg = `Resumed`;
          break;
        case 'stop':
          msg = `Stopped`;
          break;
        case 'alarmOff':
          msg = `Turned off`;
          break;
        default:
          msg = `Unknown action: ${action}`;
          break;
      }

      this.logs.push({
        timestamp: timestamp,
        action: action,
        msg: msg,
        timerId: timer.id,
      });
    },

    clearTimerLogs(timerId) {
      this.logs = this.logs.filter(log => log.timerId !== timerId);
      this.saveLogs();
    },

    clearTimerLogsConfirm(timerId) {
      if (confirm('Are you sure you want to delete all logs for this timer?')) {
        this.clearTimerLogs(timerId);
      }
    },

    saveLogs() {
      localStorage.setItem('timersLogs', JSON.stringify(this.logs));
    }
  };
}