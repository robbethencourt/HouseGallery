port module Gallery exposing (..)

import Html exposing (..)
import Html.Events exposing (..)
import Html.Attributes exposing (..)
import Navigation
import Json.Decode as JD
import Json.Decode.Pipeline as JDP


-- model


type alias Model =
    { error : Maybe String
    , gallery : List GalleryItem
    , active : Bool
    , routeParam : String
    , isFetching : Bool
    }


type alias GalleryItem =
    { artworkId : String
    , artist : String
    , title : String
    , year : String
    , artworkImageFile : String
    }


initModel : Model
initModel =
    { error = Nothing
    , gallery = []
    , active = False
    , routeParam = ""
    , isFetching = True
    }


init : ( Model, Cmd Msg )
init =
    ( initModel, Cmd.none )



-- update


type Msg
    = Error String
    | ArtworkPage String
    | UsersGallery String
    | ClearGallery


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        ArtworkPage artworkId ->
            ( { model
                | routeParam = artworkId
              }
            , Cmd.batch
                [ getOneArtwork artworkId
                , Navigation.newUrl "#/artwork"
                ]
            )

        Error error ->
            ( { model | error = Just error }, Cmd.none )

        UsersGallery jsonGallery ->
            decodeJson jsonGallery model

        ClearGallery ->
            ( initModel, Cmd.none )


decodeJson : String -> Model -> ( Model, Cmd Msg )
decodeJson jsonGallery model =
    case JD.decodeString decodeGalleryItem jsonGallery of
        Ok artwork ->
            ( { model
                | gallery = artwork :: model.gallery
                , isFetching = False
              }
            , Cmd.none
            )

        Err err ->
            ( { model | error = Just err }, Cmd.none )


decodeGalleryItem : JD.Decoder GalleryItem
decodeGalleryItem =
    JDP.decode GalleryItem
        |> JDP.required "artworkId" JD.string
        |> JDP.required "artist" JD.string
        |> JDP.required "title" JD.string
        |> JDP.required "year" JD.string
        |> JDP.required "artworkImageFile" JD.string



-- view


view : Model -> Html Msg
view model =
    if model.isFetching then
        div [ class "main" ]
            [ h1 [] [ text "Loading..." ] ]
    else
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
        |> table [ class "table table-striped" ]


painting : GalleryItem -> Html Msg
painting { artist, title, year, artworkImageFile, artworkId } =
    tr []
        [ td [] [ img [ src artworkImageFile, class "thumbnail" ] [] ]
        , td [] [ text artist ]
        , td [] [ a [ onClick (ArtworkPage artworkId) ] [ text title ] ]
        , td [] [ text year ]
        ]


galleryHeader : Html Msg
galleryHeader =
    thead []
        [ tr []
            [ th [] [ text "Artwork" ]
            , th [] [ text "Artist" ]
            , th [] [ text "Title" ]
            , th [] [ text "Year" ]
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
    Sub.batch
        [ usersGallery UsersGallery
        , clearGallery (always ClearGallery)
        ]


port usersGallery : (String -> msg) -> Sub msg


port clearGallery : (() -> msg) -> Sub msg


port getOneArtwork : String -> Cmd msg
