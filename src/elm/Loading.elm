module Loading exposing (..)

import Html exposing (..)
import Svg exposing (..)
import Svg.Attributes exposing (..)


loadingSvg : Html.Html msg
loadingSvg =
    div [ class "loading-container" ]
        [ svg
            [ width "250", height "125", viewBox "0 0 300 200" ]
            [ g [ id "houseable-loading" ]
                [ polygon [ id "middle-2", fill "#2A303F", points "122.333,127.668 94.664,100.001 66.996,72.332 122.333,72.332" ] []
                , polygon [ id "middle-1", fill "#2A303F", points "66.996,72.332 94.664,100.001 122.333,127.67 66.996,127.67" ] []
                , polygon [ id "middle-4", fill "#2A303F", points "177.669,127.668 150.001,100 122.332,72.332 177.669,72.332" ] []
                , polygon [ id "middle-3", fill "#2A303F", points "122.333,72.332 150.001,100.001 177.669,127.67 122.333,127.67" ] []
                , polygon [ id "middle-6", fill "#38DDE5", points "233.005,127.668 205.338,100 177.669,72.332 233.005,72.332" ] []
                , polygon [ id "middle-5_1", fill "#29C3D3", points "177.669,72.332 205.338,100.001 233.005,127.67 177.669,127.67" ] []
                , polygon [ id "middle-5", fill "#29C3D3", points "66.997,72.331 94.664,44.663 122.333,16.996 122.333,72.331" ] []
                , polygon [ id "top-4", fill "#29C3D3", points "177.669,72.331 150.001,44.663 122.333,16.995 177.669,16.995" ] []
                , polygon [ id "top-3", fill "#2A303F", points "122.332,16.996 150.001,44.664 177.669,72.332 122.332,72.332" ] []
                , polygon [ id "top-5", fill "#38E8E8", points "177.669,16.996 205.338,44.664 233.005,72.332 177.669,72.332" ] []
                , polygon [ id "bottom-1", fill "#2A303F", points "66.997,127.67 94.665,155.336 122.333,183.006 66.995,183.006" ] []
                , polygon [ id "bottom-2", fill "#2A303F", points "122.333,183.004 94.665,155.336 66.997,127.668 122.333,127.668" ] []
                , polygon [ id "bottom-3", fill "#F9F9F9", points "122.332,127.67 150,155.336 177.669,183.006 122.332,183.006" ] []
                , polygon [ id "bottom-4", fill "#F9F9F9", points "177.669,183.004 150.001,155.336 122.333,127.668 177.669,127.668" ] []
                , polygon [ id "bottom-6", fill "#2A303F", points "233.005,183.004 205.338,155.336 177.669,127.668 233.005,127.668" ] []
                , polygon [ id "bottom-5", fill "#2A303F", points "177.669,127.67 205.338,155.336 233.005,183.006 177.669,183.006" ] []
                ]
            ]
        ]
