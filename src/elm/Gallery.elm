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
    , searchId : String
    , userId : String
    , routeParam : String
    , isFetching : Bool
    , listView : Bool
    , tableView : Bool
    }


type alias GalleryItem =
    { artworkId : String
    , artist : String
    , title : String
    , medium : String
    , year : String
    , dimensions : String
    , price : String
    , artworkImageFile : String
    , userId : String
    , searchId : String
    }


type alias ClearGalleryReturnValue =
    { searchId : String
    , userId : String
    }


initModel : Model
initModel =
    { error = Nothing
    , gallery = []
    , searchId = ""
    , userId = ""
    , routeParam = ""
    , isFetching = True
    , listView = True
    , tableView = False
    }


init : ( Model, Cmd Msg )
init =
    ( initModel, Cmd.none )



-- update


type Msg
    = Error String
    | ArtworkPage String
    | UsersGallery String
    | ClearGallery String
    | ListView
    | TableView
    | SortGalleryByArtist
    | SortGalleryByYear


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

        ClearGallery ids ->
            jsonDecodeClearGallery ids model

        ListView ->
            ( { model
                | listView = True
                , tableView = False
              }
            , Cmd.none
            )

        TableView ->
            ( { model
                | listView = False
                , tableView = True
              }
            , Cmd.none
            )

        SortGalleryByArtist ->
            ( { model | gallery = List.sortBy .artist model.gallery }, Cmd.none )

        SortGalleryByYear ->
            ( { model | gallery = List.sortBy .year model.gallery }, Cmd.none )


jsonDecodeClearGallery : String -> Model -> ( Model, Cmd Msg )
jsonDecodeClearGallery ids model =
    case JD.decodeString decodedClearGallery ids of
        Ok clearGalleryRecord ->
            ( { model
                | searchId = clearGalleryRecord.searchId
                , userId = clearGalleryRecord.userId
                , gallery = []
              }
            , Cmd.none
            )

        Err err ->
            ( { model | error = Just err }, Cmd.none )


decodedClearGallery : JD.Decoder ClearGalleryReturnValue
decodedClearGallery =
    JDP.decode ClearGalleryReturnValue
        |> JDP.required "searchId" JD.string
        |> JDP.required "userId" JD.string


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
        |> JDP.required "dimensions" JD.string
        |> JDP.required "price" JD.string
        |> JDP.required "artworkImageFile" JD.string
        |> JDP.required "userId" JD.string
        |> JDP.required "searchId" JD.string



-- view


view : Model -> Html Msg
view model =
    if model.isFetching then
        div [ class "main" ]
            [ Loading.loadingSvg ]
    else
        div [ class "main main--gallery" ]
            [ errorPanel model.error
            , div []
                [ span [ class "glyphicon glyphicon-th-large glyphicon--custom-table", onClick ListView ] []
                , span [ class "glyphicon glyphicon-th-list glyphicon--custom-table", onClick TableView ] []
                ]
            , galleryHeader model
            , if model.listView then
                galleryListView model
              else
                div [ class "container" ]
                    [ div [ class "table-responsive" ] [ galleryTableView model ] ]
            ]


galleryListView : Model -> Html Msg
galleryListView model =
    model.gallery
        |> List.map paintingListView
        |> div [ class "container" ]


paintingListView : GalleryItem -> Html Msg
paintingListView { artist, title, medium, year, dimensions, price, artworkImageFile, artworkId, userId, searchId } =
    div [ class "row" ]
        [ div [ class "artwork-container vertical-align" ]
            [ div [ class "col-sm-6 artwork-container__col-sm-6" ]
                [ img [ src artworkImageFile ] [] ]
            , div [ class "col-sm-6 artwork-container__col-sm-6" ]
                [ div [ class "text-center artwork-container__artwork-details" ]
                    [ h2 [ class "artwork-container__artwork-details__artist" ] [ text artist ]
                    , p [ class "artwork-container__artwork-details__title" ] [ text (title ++ ", " ++ year) ]
                    , p [ class "artwork-container__artwork-details__medium" ] [ text medium ]
                    , p [ class "artwork-container__artwork-details__dimensions" ] [ text dimensions ]
                    , p [ class "align-middle artwork-container__artwork-details__price" ] [ text ("$" ++ price) ]
                    , if userId == searchId then
                        button [ class "btn btn--green", onClick (ArtworkPage artworkId) ] [ text "view artwork" ]
                      else
                        p [] []
                    ]
                ]
            ]
        ]


galleryTableView : Model -> Html Msg
galleryTableView model =
    model.gallery
        |> List.indexedMap paintingTableView
        |> tbody [ class "main--gallery--table" ]
        |> (\g -> galleryTableHeader :: [ g ])
        |> table [ class "table table-striped table--custom" ]


paintingTableView : Int -> GalleryItem -> Html Msg
paintingTableView index { artist, title, medium, year, dimensions, price, artworkImageFile, artworkId, userId, searchId } =
    tr []
        [ td [] [ text (toString (index + 1)) ]
        , if userId == searchId then
            td [] [ img [ src artworkImageFile, class "thumbnail", onClick (ArtworkPage artworkId) ] [] ]
          else
            td [] [ img [ src artworkImageFile, class "thumbnail" ] [] ]
        , td [] [ text artist ]
        , if userId == searchId then
            td [] [ a [ onClick (ArtworkPage artworkId) ] [ text title ] ]
          else
            td [] [ text title ]
        , td [] [ text year ]
        , td [] [ text medium ]
        , td [] [ text dimensions ]
        , td [] [ text ("$" ++ price) ]
        ]


galleryTableHeader : Html Msg
galleryTableHeader =
    thead [ class "table-head--custom" ]
        [ tr []
            [ th [] [ text "No." ]
            , th [] [ text "Artwork" ]
            , th [ class "table-sort-link", onClick SortGalleryByArtist ] [ text "Artist" ]
            , th [] [ text "Title" ]
            , th [ class "table-sort-link", onClick SortGalleryByYear ] [ text "Year" ]
            , th [] [ text "Medium" ]
            , th [] [ text "Dimensions" ]
            , th [] [ text "Price" ]
            ]
        ]


galleryHeader : Model -> Html Msg
galleryHeader model =
    if model.userId == model.searchId then
        h2 [ class "text-center gallery-header" ] [ text "Your Gallery" ]
    else
        div [] []


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
        , clearGallery ClearGallery
        ]


port usersGallery : (String -> msg) -> Sub msg


port clearGallery : (String -> msg) -> Sub msg


port getOneArtwork : String -> Cmd msg
