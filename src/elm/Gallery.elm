module Gallery exposing (..)

import Html exposing (..)
import Html.Events exposing (..)
import Html.Attributes exposing (..)
import Navigation


-- model


type alias Model =
    { error : Maybe String
    , gallery : List GalleryItem
    , active : Bool
    }


type alias GalleryItem =
    { paintingId : String
    , artist : String
    , title : String
    , year : Int
    , artworkIcon : String
    }


tempGallery : List GalleryItem
tempGallery =
    [ GalleryItem "1" "Some Dude" "Painting of 1" 1997 "an href needs to go here"
    , GalleryItem "2" "Some Woman" "Painting of the Number 2" 2003 "another href needed"
    ]


initModel : Model
initModel =
    { error = Nothing
    , gallery = tempGallery
    , active = False
    }


init : ( Model, Cmd Msg )
init =
    ( initModel, Cmd.none )



-- update


type Msg
    = Error String
    | ArtworkPage String


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        ArtworkPage pId ->
            ( initModel, Navigation.newUrl ("#/artwork/" ++ pId) )

        Error error ->
            ( { model | error = Just error }, Cmd.none )



-- view


view : Model -> Html Msg
view model =
    div [ class "main" ]
        [ errorPanel model.error
        , gallery model
        ]


gallery : Model -> Html Msg
gallery { gallery } =
    gallery
        |> List.map painting
        |> tbody []
        |> (\g -> galleryHeader :: [ g ])
        |> table []


painting : GalleryItem -> Html Msg
painting { artist, title, year, artworkIcon, paintingId } =
    tr []
        [ td [] [ text artist ]
        , td [] [ a [ onClick (ArtworkPage paintingId) ] [ text title ] ]
        , td [] [ text (toString year) ]
        , td [] [ text (artworkIcon) ]
        , td [] [ button [ class paintingId ] [ text "Edit" ] ]
        ]


galleryHeader : Html Msg
galleryHeader =
    thead []
        [ tr []
            [ th [] [ text "Artist" ]
            , th [] [ text "Title" ]
            , th [] [ text "Year" ]
            , th [] [ text "Artwork" ]
            ]
        ]


errorPanel : Maybe String -> Html a
errorPanel error =
    case error of
        Nothing ->
            text ""

        Just msg ->
            div [ class "error" ]
                [ text msg ]



-- subscriptions


subscriptions : Model -> Sub Msg
subscriptions model =
    Sub.none
