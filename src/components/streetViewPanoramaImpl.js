import {omit} from 'lodash';

import {loaded} from '../manager.js';
import {DeferredReadyMixin} from '../utils/deferredReady.js';
import eventsBinder from '../utils/eventsBinder.js';
import propsBinder from '../utils/propsBinder.js';
import getPropsMixin from '../utils/getPropsValuesMixin.js';
import mountableMixin from '../utils/mountableMixin.js';

const props = {
  zoom: {
    type: Number
  },
  pov: {
    type: Object,
    trackProperties: ['pitch', 'heading']
  },
  position: {
    type: Object,
  },
  pano: {
    type: String
  },
  motionTracking: {
    type: Boolean
  },
  visible: {
    type: Boolean,
    default: true,
  },
  options: {
    type: Object,
    default () {return {};}
  }
};

const events = [
  'closeclick',
  'status_changed',
];

// Other convenience methods exposed by Vue Google Maps
const customMethods = {
  resize() {
    if (this.$panoObject) {
      google.maps.event.trigger(this.$panoObject, 'resize');
    }
  },
};

// Methods is a combination of customMethods and linkedMethods
const methods = Object.assign({}, customMethods);

export default {
  mixins: [getPropsMixin, DeferredReadyMixin, mountableMixin],
  props: props,
  replace: false, // necessary for css styles
  methods,

  created() {
    this.$panoCreated = new Promise((resolve, reject) => {
      this.$panoCreatedDeferred = {resolve, reject};
    });

    const updateCenter = () => {
      if (!this.panoObject) return;

      this.$panoObject.setPosition({
        lat: this.finalLat,
        lng: this.finalLng,
      })
    }
    this.$watch('finalLat', updateCenter)
    this.$watch('finalLng', updateCenter)
  },

  computed: {
    finalLat () {
      return this.position &&
        (typeof this.position.lat === 'function') ? this.position.lat() : this.position.lat
    },
    finalLng () {
      return this.position &&
        (typeof this.position.lng === 'function') ? this.position.lng() : this.position.lng
    },
  },

  watch: {
    zoom(zoom) {
      if (this.$panoObject) {
        this.$panoObject.setZoom(zoom);
      }
    }
  },

  deferredReady() {
    return loaded.then(() => {
      // getting the DOM element where to create the map
      const element = this.$refs['vue-street-view-pano'];

      // creating the map
      const options = Object.assign({},
          this.options,
          omit(this.getPropsValues(), ['options'])
        );

      this.$panoObject = new google.maps.StreetViewPanorama(element, options);

      // binding properties (two and one way)
      propsBinder(this, this.$panoObject,
          omit(props, ['position', 'zoom']));

      //binding events
      eventsBinder(this, this.$panoObject, events);

      this.$panoCreatedDeferred.resolve(this.$panoObject);

      return this.$panoCreated;
    })
    .catch((error) => {
      throw error;
    });
  },
};
