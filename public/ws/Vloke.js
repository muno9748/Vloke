(async () => {
    await $.getScript('/public/ws/VlokeStatic.js');
    let Vloke = {
        playground: {
            scripts: [],
            blockMenu: {},
            container: {
                objects: [],
                render() {
                    Vloke.playground.blockMenu.render();
                }
            }
        },
        Mutate: {},
        engine: {},
        event: {}
    };
    window.Vloke = Vloke;
    Vloke.BlockExecutor = class VlokeBlockExecutor {
        constructor(script) {
            this.block = script;
            return this;
        }

        getParam(name) {
            return Object.values(this.block.params).find(el => el.name == name)?.value;
        }

        Execute() {
            this.block.Execute(this);
        }
    }
    Vloke.playground.blockMenu.currentTab = 'play';
    Vloke.playground.blockMenu.Tabs = ['play', 'blocks', 'variables'];
    Vloke.playground.blockMenu.element = $('.blockMenu .article')[0];
    Vloke.playground.blockMenu.$element = $(Vloke.playground.blockMenu.element);
    Vloke.playground.blockMenu.updateElement = () => {
        Vloke.playground.blockMenu.element = $('.blockMenu .article')[0];
        Vloke.playground.blockMenu.$element = $(Vloke.playground.blockMenu.element);
    }
    Vloke.playground.blockMenu.render = () => {
        let tab = Vloke.playground.blockMenu.currentTab;
        if(!Vloke.playground.blockMenu.Tabs.includes(tab)) throw new Error('Invalid tab');
        Vloke.playground.blockMenu.clear();
        switch(tab) {
            case 'play':
                let $element = Vloke.playground.blockMenu.$element;
                $element.prepend(`
                    <canvas class="vlokeEngine">Canvas not supported.</canvas>
                    <div class="objects list-group list-group-flush"></div>
                `);
                Vloke.playground.container.objects.forEach(el => {
                    $('.objects').append(`<li class="list-group-item" id="object_${el.id}"><div class="image"></div>${el.name}</li>`);
                    $(`#object_${el.id} div.image`).css('background-image',`url(${el.entity.pictures.currentPicture})`);
                });
                Vloke.playground.blockMenu.updateElement();
                break;
            default:
                throw new Error('Invalid tab');
        }
    }
    Vloke.playground.blockMenu.clear = () => {
        Vloke.playground.blockMenu.element.innerHTML = '';
    }
    Vloke.Entity = class VlokeEntity {
        constructor(name,image) {
            /**
             * @param { script } @todo Execute System
            **/
            this.script = {};
            this.name = name;
            this.id = VlokeStatic.Utils.generateId();
            this.entity = {};
            this.entity.pictures = [];
            this.entity.pictures.push(image);
            this.entity.pictures.currentPicture = image;
            this.X = 0;
            this.Y = 0;
            this.scale = 1;
            this.scaleX = 1;
            this.scaleY = 1;
        }

        render() {
            Vloke.playground.container.objects.push(this);
            Vloke.playground.container.render();
            /**
             * @todo Canvas
            **/
        }
    }
    new Vloke.Entity('VLOKE','/public/images/start_icon.svg').render();
    Vloke.engine.run = async () => {
        let scripts = Vloke.playground.scripts;
        let startScripts = scripts.filter(script => script.type == 'def_when_start');
        startScripts.forEach(script => {
            let executor = new Vloke.GroupExecutor(script);
            executor.Execute();
        });
    }
    Vloke.playground.blockMenu.render();
    Vloke.GroupExecutor = class VlokeGroupExecutor {
        constructor(block) {
            this.blocks = [block];
            this.executor = null;
            let isEnd = false;
            let child = block.child;
            if(child == "") isEnd = true;
            while(!isEnd) {
                this.blocks.push(Vloke.playground.scripts.find(script => script.id == child));
                child = Vloke.playground.scripts.find(script => script.id == child).child;
                if(child == "") isEnd = true;
            }
        }

        async Execute() {
            try {
                await new Promise(r => {
                    this.blocks.forEach(async script => {
                        this.executor = new Vloke.BlockExecutor(script);
                        script.Execute(this.executor);
                    });
                    r();
                });
            } catch (e) {
                VlokeStatic.Utils.stopProjectWithError('경고','코드 실행중 문제가 발생했습니다.',e.toString());
            }
        }
    }
    Vloke.Event = class VlokeEvent {
        constructor(block) {
            this.block = block;
        }

        Next() {
            let groupExecutor = new Vloke.GroupExecutor(this.block);
            groupExecutor.Execute();
        }
        
        Raise(e) {
            Vloke.engine.raiseEvent(e);
        }
    }
    new VlokeStatic.BlockSchema('print');
    new VlokeStatic.BlockSchema('def_when_start');
    new VlokeStatic.BlockSchema('print');
    new VlokeStatic.BlockSchema('def_when_start');
    const registerDragEvent = (block) => {
        block.find('.textField').on('input', e => {
            let Target = $(e.target);
            if(Target.html().indexOf("<br>") != -1) {
                Target[0].innerText = (Target.html().replace(/\<br\>/gi, ''));
            }
            let elem = Vloke.playground.scripts.find(el => el.id == block.attr('id').replace('Block_',''));
            elem.params[Target.attr('id').replace('textField_','')] = {value:Target.text(),name:elem.params[Target.attr('id').replace('textField_','')].name};
            if(Target.text().trim() == "") {
                Target.html("&nbsp;")
            }
            Vloke.playground.scripts.find(el => el.id == block.attr('id').replace('Block_','')).updateSkeleton();
        });
        block[0].onmousedown = e => {
            let Target = Vloke.playground.scripts.find(el => el.id == block.attr('id').replace('Block_',''));
            Target.pos.sX = e.pageX - Target.element.offsetLeft;
            Target.pos.sY = e.pageY - Target.element.offsetTop;
            $(document).on('mousemove', e => {
                let Target = Vloke.playground.scripts.find(el => el.id == block.attr('id').replace('Block_',''));
                let $Target = $(Target.element)
                let x = e.pageX - Target.element.offsetLeft;
                let y = e.pageY - Target.element.offsetTop;
                Target.pos.X = parseFloat($Target.css("left").replace("px",""));
                Target.pos.Y = parseFloat($Target.css("top").replace("px",""));
                $Target.css("left", `${parseFloat($Target.css("left").replace("px","")) + (x - Target.pos.sX)}px`);
                $Target.css("top", `${parseFloat($Target.css("top").replace("px","")) + (y - Target.pos.sY)}px`);
                let count = 0;
                Vloke.playground.scripts.forEach(script => {
                    if(count != 0) return;
                    let code = script;
                    let tcode = Target;
                    code.pos.X = parseFloat($(code.element).css("left").replace("px",""));
                    code.pos.Y = parseFloat($(code.element).css("top").replace("px",""));
                    tcode.pos.X = parseFloat($(tcode.element).css("left").replace("px",""));
                    tcode.pos.Y = parseFloat($(tcode.element).css("top").replace("px",""));
                    if(code.id == tcode.id) {
                        return;
                    }
                    $(tcode.element).css('z-index', '2');
                    $(code.element).css('z-index','1');
                    if(!(code.pos.X < tcode.pos.X + 35 && code.pos.X > tcode.pos.X - 35)) {
                        for(let i = 0; i < Vloke.playground.scripts.length; i++) {
                            if(Vloke.playground.scripts[i].child == tcode.id) {
                                Vloke.playground.scripts[i].child = "";
                            }
                        }
                        tcode.child = "";
                        tcode.isFit = false;
                        tcode.pos.fX = null;
                        tcode.pos.fY = null;
                        $('.code').each((i,el__) => {
                            $(el__).children('svg.skeleton')[0].style.removeProperty('filter');
                        });
                        return;
                    }
                    if(!(code.pos.Y < tcode.pos.Y + 45 && code.pos.Y > tcode.pos.Y - 45)) {
                        for(let i = 0; i < Vloke.playground.scripts.length; i++) {
                            if(Vloke.playground.scripts[i].child == tcode.id) {
                                Vloke.playground.scripts[i].child = "";
                            }
                        }
                        tcode.child = "";
                        tcode.isFit = false;
                        tcode.pos.fX = null;
                        tcode.pos.fY = null;
                        $('.code').each((i,el__) => {
                            $(el__).children('svg.skeleton')[0].style.removeProperty('filter');
                        });
                        return;
                    }
                    if(code.pos.Y < tcode.pos.Y) {
                        if(tcode.type.startsWith('def_')) {
                            for(let i = 0; i < Vloke.playground.scripts.length; i++) {
                                if(Vloke.playground.scripts[i].child == tcode.id) {
                                    Vloke.playground.scripts[i].child = "";
                                }
                            }
                            tcode.child = "";
                            tcode.isFit = false;
                            tcode.pos.fX = null;
                            tcode.pos.fY = null;
                            $('.code').each((i,el__) => {
                                $(el__).children('svg.skeleton')[0].style.removeProperty('filter');
                            });
                            return;
                        }
                        code.eSkeleton.style.setProperty('filter', 'drop-shadow(0px 0px 5px yellow)');
                        tcode.pos.isFit = true;
                        tcode.pos.fX = code.pos.X;
                        tcode.pos.fY = code.pos.Y + 30;
                        for(let i = 0; i < Vloke.playground.scripts.length; i++) {
                            if(Vloke.playground.scripts[i].child == tcode.id) {
                                Vloke.playground.scripts[i].child = "";
                            }
                        }
                        code.child = tcode.id;
                        tcode.child = "";
                    } else {
                        if(code.type.startsWith('def_')) {
                            for(let i = 0; i < Vloke.playground.scripts.length; i++) {
                                if(Vloke.playground.scripts[i].child == tcode.id) {
                                    Vloke.playground.scripts[i].child = "";
                                }
                            }
                            tcode.child = "";
                            tcode.isFit = false;
                            tcode.pos.fX = null;
                            tcode.pos.fY = null;
                            $('.code').each((i,el__) => {
                                $(el__).children('svg.skeleton')[0].style.removeProperty('filter');
                            });
                            return;
                        }
                        code.eSkeleton.style.setProperty('filter', 'drop-shadow(0px 0px 5px yellow)');
                        tcode.pos.isFit = true;
                        tcode.pos.fX = code.pos.X;
                        tcode.pos.fY = code.pos.Y - 30;
                        tcode.child = code.id;
                        for(let i = 0; i < Vloke.playground.scripts.length; i++) {
                            if(Vloke.playground.scripts[i].child == tcode.id) {
                                Vloke.playground.scripts[i].child = "";
                            }
                        }
                    }
                    count++;
                });
            });
            block.on('mouseup', _e => {
                $(document).unbind('mousemove');
                block.unbind('mouseup');
                $('.code').each((i,el__) => {
                    $(el__).children('svg.skeleton')[0].style.removeProperty('filter');
                });
                $('.code').each((__,_block) => {
                    _block = $(_block)
                    let Target = Vloke.playground.scripts.find(el => el.id == _block.attr('id').replace('Block_',''));
                    let $Target = $(Target.element);
                    $Target.css("left", `${Target.pos.X}px`);
                    $Target.css("top", `${Target.pos.Y}px`);
                    if(Target.pos.isFit && Target.pos.fX && Target.pos.fY) {
                        $Target.css("left", `${Target.pos.fX}px`);
                        $Target.css("top", `${Target.pos.fY}px`);
                    }
                });
                let count = 0;
                Vloke.playground.scripts.forEach(script => {
                    let Target = Vloke.playground.scripts.find(el => el.id == block.attr('id').replace('Block_',''));
                    let code = script;
                    let tcode = Target;
                    code.pos.X = parseFloat($(code.element).css("left").replace("px",""));
                    code.pos.Y = parseFloat($(code.element).css("top").replace("px",""));
                    tcode.pos.X = parseFloat($(tcode.element).css("left").replace("px",""));
                    tcode.pos.Y = parseFloat($(tcode.element).css("top").replace("px",""));
                    if(code == tcode) return;
                    if(code.pos.Y == tcode.pos.Y - 30) return;
                    if(code.pos.Y == tcode.pos.Y + 30) return;
                    ++count;
                });
                let Target = Vloke.playground.scripts.find(el => el.id == block.attr('id').replace('Block_',''));
                if(count == Vloke.playground.scripts.length - 1) {
                    Target.child = "";
                    for(let i = 0; i < Vloke.playground.scripts.length; i++) {
                        if(Vloke.playground.scripts[i].child == Target.id) {
                            Vloke.playground.scripts[i].child = "";
                        }
                    }
                }
            });
        };
    }
    $(".code").each((__,block) => {
        block = $(block);
        block.unbind();
        registerDragEvent(block);
    });
})();