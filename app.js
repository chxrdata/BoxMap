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

    const dropIconSmall = await map.loadImage('icons/drop-small.png');
    map.addImage('bundleDropSmall', dropIconSmall.data);
    const modularIconSmall = await map.loadImage('icons/modular-small.png');
    map.addImage('modularSmall', modularIconSmall.data);
    const boxIconSmall = await map.loadImage('icons/box-small.png');
    map.addImage('orangeBoxSmall', boxIconSmall.data);

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
                14, 0.5,
                20, 1
            ],
            'icon-overlap': 'always'
        },
        'paint': {
            'icon-opacity': [
                'interpolate',
                ['linear'],
                ['zoom'],
                13, 0,
                14, 1
            ] // note that features can still be clicked when opacity is 0
        },
    });

    map.addLayer({ //small icons layer
        'id': 'allStopsSmall',
        'type': 'symbol',
        'source': 'stops',
        'layout': {
            'icon-image': '{type}' + 'Small',
            'icon-size': [
                'interpolate',
                ['linear'],
                ['zoom'],
                10, 0.1,
                15, 0.4
            ],
            'icon-overlap': 'always'
        },
        'paint': {
            'icon-opacity': [
                'interpolate',
                ['linear'],
                ['zoom'],
                13, 1,
                14, 0
            ]
        },
        'maxzoom': 14
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

        //applies typeFilter to allStops, allStopsSmall, and selectedStop while keeping selectedStop filter
        map.setFilter('allStops', [
            'all',
            ['!=', ['id'], selectedFeatureId ?? ''],
            typeFilter
        ]);
        map.setFilter('allStopsSmall', [
            'all',
            ['!=', ['id'], selectedFeatureId ?? ''],
            typeFilter
        ]);
        map.setFilter('selectedStop', ['==', ['id'], selectedFeatureId ?? '']);
    })

    let selectedFeatureId = null;
    let currentFeatureCoordinates = undefined;
    const popup = new maplibregl.Popup({
        closeButton: true,
        closeOnClick: true
    });

    // on feature click behavior
    map.on('click', 'allStops', (e) => {

        if (map.getZoom() < 16) {
            map.flyTo({
                center: e.features[0].geometry.coordinates,
                zoom: 16,
            });
        } else {
            map.flyTo({
                center: e.features[0].geometry.coordinates,
                curve: 1,
                speed: 0.6
            });
        }

        //popup behavior
        const name = e.features[0].properties.location;
        const type = e.features[0].properties.type;
        const address = e.features[0].properties.address;

        //set up innerHTML
        const titleDiv = '<div class="modal-title">' + name + '</div>'
        const addressTag = '<div class="address-tag"><span class="address-icon"></span>' + address + '</div>'
        let typeTag = '';
        let instructions = '';
        switch (type) {
            case 'modular':
                typeTag = '<div class="modular-tag"><span class="modular-icon"></span>Multi-paper rack</div>';
                instructions = "<p>You can pick up a paper at the black multi-paper rack.</p>"
                break;
            case 'bundleDrop':
                typeTag = '<div class="bundle-tag"><span class="bundle-icon"></span>Inside business</div>';
                instructions = "<p>You may be able to pick up a paper inside the business.</p>"
                break;
            case 'orangeBox':
                typeTag = '<div class="box-tag"><span class="box-icon"></span>Alligator Box</div>';
                instructions = "<p>You can pick up a paper at the orange Alligator box.</p>"
                break;
        }
        const issueInstructions = '<p class="issuep">Isse with this stop? Please let us know here.</p>';
        const HTMLContent = titleDiv + typeTag + addressTag + instructions + issueInstructions;

        if (window.innerWidth < 768) { //mobile behavior
            // show selected feature icon
            selectedFeatureId = e.features[0].properties.id;
            map.setFilter('selectedStop', ['==', ['get', 'id'], selectedFeatureId]);

            // Temporarily hide feature's original icon
            map.setFilter('allStops', [
                'all',
                ['!=', ['get', 'id'], selectedFeatureId],
                ['any', ...StopsToFilterArr.map(type => //This is type filter from above
                    ['==', ['get', 'type'], type])]
            ])
            map.setFilter('allStopsSmall', [
                'all',
                ['!=', ['get', 'id'], selectedFeatureId],
                ['any', ...StopsToFilterArr.map(type => //This is type filter from above
                    ['==', ['get', 'type'], type])]
            ])
            const modal = document.getElementById("modal");
            const modalcontent = document.getElementById("modalcontent");

            const span = document.getElementsByClassName("close")[0];

            modalcontent.innerHTML = HTMLContent;
            modal.style.bottom = "0px"

            //close modal and remove selected icon when clicking the X
            span.onclick = function () {
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
        } else { //desktop behavior
            const featureCoordinates = e.features[0].geometry.coordinates.toString();
            if (currentFeatureCoordinates !== featureCoordinates) {
                currentFeatureCoordinates = featureCoordinates;

                const coordinates = e.features[0].geometry.coordinates.slice();

                // Ensure that if the map is zoomed out such that multiple
                // copies of the feature are visible, the popup appears
                // over the copy being pointed to.
                while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                    coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
                }

                // Populate the popup and set its coordinates
                // based on the feature found.
                setTimeout(() => {
                    popup
                    .setLngLat(coordinates)
                    .setHTML(HTMLContent)
                    .addTo(map);
                }, 300)
            }
        }
    });

    function closePopup() {
        popup.remove();
        modal.style.bottom = "-300px";
        selectedFeatureId = null
        map.setFilter('selectedStop', ['==', ['get', 'id'], selectedFeatureId]);
        map.setFilter('allStops', [
            'all',
            ['!=', ['get', 'id'], selectedFeatureId],
            ['any', ...StopsToFilterArr.map(type => //This is type filter from above
                ['==', ['get', 'type'], type])]
        ])
        map.setFilter('allStopsSmall', [
            'all',
            ['!=', ['get', 'id'], selectedFeatureId],
            ['any', ...StopsToFilterArr.map(type => //This is type filter from above
                ['==', ['get', 'type'], type])]
        ])
    }

    // close popup when clicking on something other than feature
    map.on('click', (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['allStops'] });
        if (features.length === 0) {
            closePopup()
        }
    });

    let windowStatus = ""
    function setWindowStatus() {
        if (window.innerWidth > 768) {
            windowStatus = "desktop"
        } else {
            windowStatus = "mobile"
        }
    }
    setWindowStatus();

    window.addEventListener('resize', () => {
        if (windowStatus == "desktop") {
            if (window.innerWidth < 768) {
                closePopup()
            }
        }
        if (windowStatus == "mobile") {
            if (window.innerWidth > 768) {
                closePopup()
            }
        }
        setWindowStatus();
    })

});
