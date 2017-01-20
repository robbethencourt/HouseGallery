port module Main exposing (..)

import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (..)
import Navigation
import Gallery
import Login
import AddArtwork


-- model


type alias Model =
    { page : Page
    , gallery : Gallery.Model
    , login : Login.Model
    , addArtwork : AddArtwork.Model
    , token : Maybe String
    , loggedIn : Bool
    }


type Page
    = NotFound
    | GalleryPage
    | LoginPage
    | AddArtworkPage


init : Navigation.Location -> ( Model, Cmd Msg )
init location =
    let
        page =
            hashToPage location.hash

        ( galleryInitModel, galleryCmd ) =
            Gallery.init

        ( loginInitModel, loginCmd ) =
            Login.init

        ( addArtworkInitModel, addArtworkCmd ) =
            AddArtwork.init

        initModel =
            { page = page
            , gallery = galleryInitModel
            , login = loginInitModel
            , addArtwork = addArtworkInitModel
            , token = Nothing
            , loggedIn = False
            }

        cmds =
            Cmd.batch
                [ Cmd.map GalleryMsg galleryCmd
                , Cmd.map LoginMsg loginCmd
                , Cmd.map AddArtworkMsg addArtworkCmd
                ]
    in
        ( initModel, cmds )



-- update


type Msg
    = Navigate Page
    | ChangePage Page
    | GalleryMsg Gallery.Msg
    | LoginMsg Login.Msg
    | AddArtworkMsg AddArtwork.Msg


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        Navigate page ->
            ( { model | page = page }, Navigation.newUrl <| pageToHash page )

        ChangePage page ->
            ( { model | page = page }, Cmd.none )

        GalleryMsg msg ->
            let
                ( galleryModel, cmd ) =
                    Gallery.update msg model.gallery
            in
                ( { model | gallery = galleryModel }
                , Cmd.map GalleryMsg cmd
                )

        LoginMsg msg ->
            let
                ( loginModel, cmd, token ) =
                    Login.update msg model.login

                loggedIn =
                    token /= Nothing
            in
                ( { model
                    | login = loginModel
                    , token = token
                    , loggedIn = loggedIn
                  }
                , Cmd.map LoginMsg cmd
                )

        AddArtworkMsg msg ->
            let
                ( addArtworkModel, cmd ) =
                    AddArtwork.update msg model.addArtwork
            in
                ( { model | addArtwork = addArtworkModel }
                , Cmd.map AddArtworkMsg cmd
                )



-- view


view : Model -> Html Msg
view model =
    let
        page =
            case model.page of
                GalleryPage ->
                    Html.map GalleryMsg
                        (Gallery.view model.gallery)

                LoginPage ->
                    Html.map LoginMsg
                        (Login.view model.login)

                AddArtworkPage ->
                    Html.map AddArtworkMsg
                        (AddArtwork.view model.addArtwork)

                NotFound ->
                    div [ class "main" ]
                        [ h1 []
                            [ text "Page Not Found!" ]
                        ]
    in
        div []
            [ pageHeader model
            , page
            ]


pageHeader : Model -> Html Msg
pageHeader model =
    header []
        [ a [ href "#/" ] [ text "Home" ]
        , ul []
            [ li []
                [ a [ onClick (Navigate GalleryPage) ] [ text "Gallery" ] ]
            , li []
                [ a [ onClick (Navigate AddArtworkPage) ] [ text "Add Artwork" ] ]
            ]
        , ul []
            [ li []
                [ a [ onClick (Navigate LoginPage) ] [ text "Login" ]
                ]
            ]
        ]



-- subscriptions


subscriptions : Model -> Sub Msg
subscriptions model =
    let
        gallerySub =
            Gallery.subscriptions model.gallery

        loginSub =
            Login.subscriptions model.login

        addArtworkSub =
            AddArtwork.subscriptions model.addArtwork
    in
        Sub.batch
            [ Sub.map GalleryMsg gallerySub
            , Sub.map LoginMsg loginSub
            , Sub.map AddArtworkMsg addArtworkSub
            ]


hashToPage : String -> Page
hashToPage hash =
    case hash of
        "#/" ->
            GalleryPage

        "" ->
            GalleryPage

        "#/gallery" ->
            GalleryPage

        "#/login" ->
            LoginPage

        "#/addArtwork" ->
            AddArtworkPage

        _ ->
            NotFound


pageToHash : Page -> String
pageToHash page =
    case page of
        GalleryPage ->
            "#/gallery"

        LoginPage ->
            "#/login"

        AddArtworkPage ->
            "#/addArtwork"

        NotFound ->
            "#notFound"



-- main


locationToMsg : Navigation.Location -> Msg
locationToMsg location =
    location.hash
        |> hashToPage
        |> ChangePage


main : Program Never Model Msg
main =
    Navigation.program locationToMsg
        { init = init
        , update = update
        , view = view
        , subscriptions = subscriptions
        }
