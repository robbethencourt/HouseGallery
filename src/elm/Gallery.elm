port module Gallery exposing (..)

import Html exposing (..)
import Html.Events exposing (..)
import Html.Attributes exposing (..)
import Navigation
import Json.Decode as JD
import Json.Decode.Pipeline as JDP
import Loading


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
    , medium : String
    , year : String
    , price : String
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
        |> JDP.required "medium" JD.string
        |> JDP.required "year" JD.string
        |> JDP.required "price" JD.string
        |> JDP.required "artworkImageFile" JD.string



-- view


view : Model -> Html Msg
view model =
    if model.isFetching then
        div [ class "main" ]
            -- [ img [ src "dist/img/houseable-loading.svg", class "loading-svg" ] [] ]
            [ Loading.loadingSvg ]
    else
        div [ class "main main--gallery" ]
            [ errorPanel model.error
            , galleryHeader
            , gallery model
            ]


gallery : Model -> Html Msg
gallery { gallery } =
    gallery
        |> List.map painting
        |> div [ class "container" ]


painting : GalleryItem -> Html Msg
painting { artist, title, medium, year, price, artworkImageFile, artworkId } =
    div [ class "row" ]
        [ div [ class "artwork-container vertical-align" ]
            [ div [ class "col-sm-6 artwork-container__col-sm-6" ]
                [ img [ src artworkImageFile ] []
                ]
            , div [ class "col-sm-6 artwork-container__col-sm-6" ]
                [ div [ class "text-center artwork-container__artwork-details" ]
                    [ h2 [ class "artwork-container__artwork-details__artist" ] [ text artist ]
                    , p [ class "artwork-container__artwork-details__title" ] [ text (title ++ ", " ++ year) ]
                    , p [ class "artwork-container__artwork-details__medium" ] [ text medium ]
                    , p [ class "align-middle artwork-container__artwork-details__price" ] [ text ("$" ++ price) ]
                    , button [ class "btn btn--green", onClick (ArtworkPage artworkId) ] [ text "view artwork" ]
                    ]
                ]
            ]
        ]


galleryHeader : Html Msg
galleryHeader =
    h2 [ class "text-center gallery-header" ] [ text "Your Gallery" ]


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
