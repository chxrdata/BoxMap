import "https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js";

const map = new maplibregl.Map({
    container: 'map',
    style: 'alligatorMapStyle.json',
    center: [-82.35371774106545, 29.646731779818918],
    zoom: 12,
});

map.on('load', async () => {

    const dropIcon = await map.loadImage('icons/drop.png');
    map.addImage('bundleDrop', dropIcon.data);

    const modularIcon = await map.loadImage('icons/modular.png');
    map.addImage('modular', modularIcon.data);

    const boxIcon = await map.loadImage('icons/box.png');
    map.addImage('orangeBox', boxIcon.data);

    const selectedIcon = await map.loadImage('icons/selected.png');
    map.addImage('selected', selectedIcon.data);
    

        map.addSource('stops', {
            'type': 'geojson',
            'data': 'stops030126.geojson',
            } 
        );

        map.addLayer({ //base layer
            'id': 'allStops',
            'type': 'symbol',
            'source': 'stops',
            'layout': {
                'icon-image': '{type}',
                'icon-size': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    10, 0.4,
                    20, 1
                ],
                'icon-overlap': 'always'
            },
            'paint': {
            'icon-opacity-transition': { duration: 0, delay: 200 }
        }
        });

        map.addLayer({ //selected icon layer
            'id': 'selectedStop',
            'type': 'symbol',
            'source': 'stops',
            'layout': {
                'icon-image': 'selected',
                'icon-size': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    10, 0.3,
                    20, 0.5
                ],
                'icon-overlap': 'always'
            },
            'filter': ['==', ['get', 'id'], ''],
            'paint': {
            'icon-opacity-transition': { duration: 0, delay: 0 }
        }
        });

    // change icon of clicked feature to selected using filters
    let selectedFeatureId = null;

    map.on('click', 'allStops', (e) => {
        selectedFeatureId = e.features[0].properties.id;

        // Show selected icon only for this feature
        map.setFilter('selectedStop', ['==', ['get', 'id'], selectedFeatureId]);

        // Temporarily hide feature's original icon
        map.setFilter('allStops', [
            'all',
            ['!=', ['get', 'id'], selectedFeatureId],
            ['any', ...StopsToFilterArr.map(type => //This is type filter from above
                ['==', ['get', 'type'], type])]
        ])
    });

  //Filter by type checkboxes
 let StopsToFilterArr = ['bundleDrop', 'modular', 'orangeBox'];

  document.getElementById('checkboxes').addEventListener('change', (e) => {
    const checkedType = e.target.value;
    const checkedState = e.target.checked;
    const modal = document.getElementById("modal"); //so it can be closed

    modal.style.bottom = "-300px"; //close modal on legend click

    //behavior based on checked or unchecked
    if (checkedState) {
      if (!StopsToFilterArr.includes(checkedType)) {
        StopsToFilterArr.push(checkedType)
      }
    } else {
      const index = StopsToFilterArr.indexOf(checkedType);
      if (index > -1) {
        StopsToFilterArr.splice(index, 1);
      }
    }

    //sets typeFilter to stops in in StopsToFilterArr
    const typeFilter = [
      'any', ...StopsToFilterArr.map(type => ['==', ['get', 'type'], type])];

    //applies typeFilter to allStops and selectedStop while keeping selectedStop filter
    map.setFilter('allStops', [
        'all',
        ['!=', ['id'], selectedFeatureId ?? ''],
        typeFilter
    ]);
    map.setFilter('selectedStop', ['==', ['id'], selectedFeatureId ?? '']);
  })

  // Initialize hover popup
  const popup = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: true,
      className: 'hover-popup'
  });

  /*
  //popup on hover (use on desktop only)
  // Make sure to detect marker change for overlapping markers
  // and use mousemove instead of mouseenter event
  let currentFeatureCoordinates = undefined;
  map.on('mousemove', 'allStops', (e) => {
      const featureCoordinates = e.features[0].geometry.coordinates.toString();
      if (currentFeatureCoordinates !== featureCoordinates) {
          currentFeatureCoordinates = featureCoordinates;

          // Change the cursor style as a UI indicator.
          map.getCanvas().style.cursor = 'pointer';

          const coordinates = e.features[0].geometry.coordinates.slice();
          const name = e.features[0].properties.location;

          // Ensure that if the map is zoomed out such that multiple
          // copies of the feature are visible, the popup appears
          // over the copy being pointed to.
          while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
              coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
          }

          // Populate the popup and set its coordinates
          // based on the feature found.
          popup.setLngLat(coordinates).setHTML(name).addTo(map);
      }
  });
  */

  //popup on click
  map.on('click', 'allStops', (e) => {
      const name = e.features[0].properties.location;
      const type = e.features[0].properties.type;
      const address = e.features[0].properties.address;

      const modal = document.getElementById("modal");
      const modalcontent = document.getElementById("modalcontent");

      const span = document.getElementsByClassName("close")[0];

      //set up innerHTML
      const titleDiv = '<div class="modal-title">' + name + '</div>'
      const addressTag = '<div class="address-tag"><span class="address-icon"></span>' + address + '</div>'
      let typeTag = '';
      let instructions = '';
      switch (type) {
        case 'modular':
            typeTag = '<div class="modular-tag"><span class="modular-icon"></span>Multi-paper rack</div>';
            instructions = "<p>modular instructions here. Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci.</p>"
            break;
        case 'bundleDrop':
            typeTag = '<div class="bundle-tag"><span class="bundle-icon"></span>Inside business</div>';
            instructions = "<p>bundle instructions here. Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci.</p>"
            break;
        case 'orangeBox':
            typeTag = '<div class="box-tag"><span class="box-icon"></span>Alligator Box</div>';
            instructions = "<p>box instructions here. Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci.</p>"
            break;
      }

      modalcontent.innerHTML = titleDiv + typeTag + addressTag + instructions;
      modal.style.bottom = "0px"

      //close modal and remove selected icon when clicking the X
      span.onclick = function() {
      modal.style.bottom = "-300px";
        selectedFeatureId = null
        map.setFilter('selectedStop', ['==', ['get', 'id'], selectedFeatureId]);
        map.setFilter('allStops', [
            'all',
            ['!=', ['get', 'id'], selectedFeatureId],
            ['any', ...StopsToFilterArr.map(type => //This is type filter from above
            ['==', ['get', 'type'], type])]
        ])
      }

      // close modal and remove selected icon when clicking on something other than feature
        map.on('click', (e) => {
            const features = map.queryRenderedFeatures(e.point, { layers: ['allStops'] });
            if (features.length === 0) {
                modal.style.bottom = "-300px";
                selectedFeatureId = null
                map.setFilter('selectedStop', ['==', ['get', 'id'], selectedFeatureId]);
                map.setFilter('allStops', [
                    'all',
                    ['!=', ['get', 'id'], selectedFeatureId],
                    ['any', ...StopsToFilterArr.map(type => //This is type filter from above
                    ['==', ['get', 'type'], type])]
              ])
            }
        });

  });

  map.on('mouseleave', 'allStops', () => {
      currentFeatureCoordinates = undefined;
      map.getCanvas().style.cursor = '';
      popup.remove();
  });

});
